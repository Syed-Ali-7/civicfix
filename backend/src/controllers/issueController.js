const { validationResult } = require('express-validator');
const { Issue, statuses } = require('../models');
const { reverseGeocode } = require('../utils/geocoding');
const { computePHash, findSimilarImages } = require('../utils/phash');
const { verifyPothole } = require('../utils/potholeDetectionAI');
const logger = require('../utils/logger');
const path = require('path');

// EXIF + geo distance validation
// We use exiftool to read EXIF metadata from uploaded images (if present)
// and geolib to compute distance between EXIF GPS and device GPS.
const { ExifTool } = require('exiftool-vendored');
const exiftool = new ExifTool({ taskTimeoutMillis: 5000 });
const { getDistance } = require('geolib');

const createIssue = async (req, res, next) => {
  try {
    logger.request('POST', '/api/issues', {
      hasFile: !!req.file,
      bodyKeys: Object.keys(req.body),
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, latitude, longitude, status } = req.body;

    // Convert latitude and longitude to numbers if they're strings
    let lat = parseFloat(latitude);
    let lon = parseFloat(longitude);

    // Validate location coordinates
    if (
      isNaN(lat) ||
      isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        message: `Invalid location coordinates. Latitude: ${lat}, Longitude: ${lon}`,
      });
    }

    // Handle file upload - get photo URL from uploaded file
    let photoUrl = null;
    if (req.file) {
      // Construct full URL to the uploaded image.
      // If API_HOST is set (e.g., for mobile/tunnel access), use it so the app
      // always gets a consistent, reachable URL. Otherwise fall back to req.host.
      let host = req.get('host');
      if (process.env.API_HOST) {
        host = process.env.API_HOST;
      }
      const protocol =
        process.env.API_PROTOCOL ||
        req.protocol ||
        req.headers['x-forwarded-proto'] ||
        'http';
      photoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else if (req.body.photo_url) {
      // Fallback to photo_url if provided (for backward compatibility)
      photoUrl = req.body.photo_url;
    }

    // Flag to mark issues that require manual review (e.g. when EXIF GPS is missing)
    let needs_review = false;

    // If user provided a remote photo URL (no uploaded file), we won't have EXIF data.
    // Mark this for manual review so admins can validate the report.
    if (!req.file && req.body.photo_url) {
      needs_review = true;
    }

    // ==================== AI POTHOLE VERIFICATION (RUN FIRST) ====================
    // Run AI detection BEFORE EXIF validation to quickly reject non-pothole images
    // This saves time on expensive metadata checks for obviously wrong images
    let ai_verified = null;
    let ai_confidence = null;
    let ai_label = null;

    if (req.file) {
      try {
        const uploadedPath =
          req.file.path ||
          path.join(__dirname, '../../uploads', req.file.filename);

        const aiResult = await verifyPothole(uploadedPath);

        ai_verified = aiResult.isPothole;
        ai_confidence = aiResult.confidence;
        ai_label = aiResult.label;

        logger.debug('AI verification complete', {
          isPothole: aiResult.isPothole,
          confidence: aiResult.confidence,
        });

        if (!aiResult.isPothole) {
          return res.status(400).json({
            message:
              'This does not appear to be a pothole or road damage. Please upload a photo of an actual pothole or road damage.',
            ai_result: {
              isPothole: false,
              confidence: aiResult.confidence,
              topPrediction: aiResult.topPrediction,
              reason: aiResult.analysis?.hasRejectKeyword
                ? 'Contains people/animals/indoor content'
                : 'Not a road photo',
            },
          });
        }
      } catch (aiErr) {
        // If AI verification fails, reject the upload with friendly message
        console.warn('⚠️  AI verification failed:', aiErr.message);
        return res.status(400).json({
          message:
            '⚠️  Could not verify image quality. Please try again with a clearer photo.',
          error: aiErr.message,
        });
      }
    }
    // ====================================================================

    // Reverse geocode coordinates to get address
    let address = null;
    try {
      if (latitude && longitude) {
        address = await reverseGeocode(latitude, longitude);
      }
    } catch (geocodeError) {
      // Even if geocoding fails, we have the coordinates
      // The geocoding function already returns a fallback, but handle errors here
      console.warn('⚠️  Geocoding error:', geocodeError.message);
      address = null; // Will be set by reverseGeocode function
    }
    if (req.file) {
      const uploadedPath =
        req.file.path ||
        path.join(__dirname, '../../uploads', req.file.filename);

      try {
        // Read EXIF metadata from the uploaded file
        const exif = await exiftool.read(uploadedPath);

        // Look for various forms of GPS data
        const gpsFields = Object.keys(exif).filter((key) =>
          key.startsWith('GPS')
        );

        // EXIF VALIDATION
        // Accept camera photos (with Make/Model) or gallery photos (without Make/Model)
        // 1. REJECT if no EXIF data or only has minimal/generic fields
        // Check for meaningful EXIF data - at least one of: Make/Model (camera), DateTimeOriginal, GPS
        const hasMakeOrModel = !!(exif.Make || exif.Model);
        const hasDateTimeOriginal = !!exif.DateTimeOriginal;
        const hasGPS = gpsFields.length > 0;
        const hasSignificantExif =
          hasMakeOrModel || hasDateTimeOriginal || hasGPS;

        if (!exif || Object.keys(exif).length === 0 || !hasSignificantExif) {
          return res.status(400).json({
            message:
              'Photo has no camera metadata. Please capture a new photo directly with your device camera or select from your device photo which has accurate location information.',
          });
        }

        // ========== DATE VALIDATION ==========
        // Try to get photo date from DateTimeOriginal (camera photos) or file date (gallery)
        let photoDate = null;
        if (exif.DateTimeOriginal) {
          try {
            const normalized = String(exif.DateTimeOriginal)
              .replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
              .replace(
                /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
                '$1-$2-$3T$4:$5:$6'
              );
            const parsed = new Date(normalized);
            if (!isNaN(parsed.getTime())) {
              photoDate = parsed;
            }
          } catch (e) {
            // Fall through to FileModifyDate
          }
        }

        // If no DateTimeOriginal, try FileModifyDate (for gallery photos)
        if (!photoDate && exif.FileModifyDate) {
          try {
            const normalized = String(exif.FileModifyDate)
              .replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
              .replace(
                /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
                '$1-$2-$3T$4:$5:$6'
              );
            const parsed = new Date(normalized);
            if (!isNaN(parsed.getTime())) {
              photoDate = parsed;
            }
          } catch (e) {
            // Fall through
          }
        }

        // 2. REJECT if no valid date can be found
        if (!photoDate) {
          return res.status(400).json({
            message:
              'Photo has no date metadata. Please capture a new photo or select one with date information.',
          });
        }

        const ageMs = Date.now() - photoDate.getTime();
        const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours for both camera and gallery

        // 3. REJECT if older than 24 hours
        if (ageMs > maxAgeMs) {
          return res.status(400).json({
            message:
              'Photo is older than 24 hours. Please capture a fresh photo or select a recent one.',
          });
        }

        // ========== GPS VALIDATION ==========
        let exifLat = null;
        let exifLon = null;
        let gpsRef = { lat: 'N', lon: 'E' };
        let hasRealEmbeddedGPS = false; // True only if photo has actual GPS coordinates

        // Try multiple ways to extract GPS from EXIF
        // Method 1: Direct GPS fields (usually works for camera photos)
        if (
          exif.GPSLatitude !== undefined &&
          exif.GPSLongitude !== undefined &&
          !isNaN(exif.GPSLatitude) &&
          !isNaN(exif.GPSLongitude)
        ) {
          exifLat = exif.GPSLatitude;
          exifLon = exif.GPSLongitude;
          gpsRef.lat = exif.GPSLatitudeRef || 'N';
          gpsRef.lon = exif.GPSLongitudeRef || 'E';
          hasRealEmbeddedGPS = true; // This is real GPS data
        }
        // Method 2: GPSPosition string (sometimes used)
        else if (exif.GPSPosition && typeof exif.GPSPosition === 'string') {
          const coords = exif.GPSPosition.split(' ').map(Number);
          if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            exifLat = coords[0];
            exifLon = coords[1];
            hasRealEmbeddedGPS = true; // This is real GPS data
          }
        }
        // Method 3: Gallery photos without GPS - use device location
        else {
          exifLat = lat;
          exifLon = lon;
          hasRealEmbeddedGPS = false; // Using device location as fallback
        }

        const deviceLatNum = lat;
        const deviceLonNum = lon;

        // 4. If no EXIF GPS at all, use device location (for gallery photos)
        // This was already handled above in Method 3

        // Handle GPS coordinate formats (can be array or string or number)
        let exifLatNum = null;
        let exifLonNum = null;

        if (Array.isArray(exifLat)) {
          // GPS format: [degrees, minutes, seconds]
          exifLatNum = exifLat[0] + exifLat[1] / 60 + exifLat[2] / 3600;
        } else {
          exifLatNum = Number(exifLat);
        }

        if (Array.isArray(exifLon)) {
          // GPS format: [degrees, minutes, seconds]
          exifLonNum = exifLon[0] + exifLon[1] / 60 + exifLon[2] / 3600;
        } else {
          exifLonNum = Number(exifLon);
        }

        // Apply GPS reference directions (N/S, E/W)
        if (gpsRef.lat === 'S') exifLatNum *= -1;
        if (gpsRef.lon === 'W') exifLonNum *= -1;

        // 5. REJECT if GPS coordinates are invalid
        if (
          isNaN(exifLatNum) ||
          isNaN(exifLonNum) ||
          isNaN(deviceLatNum) ||
          isNaN(deviceLonNum)
        ) {
          return res.status(400).json({
            message:
              'Location coordinates are invalid. Please try again with valid coordinates.',
          });
        }

        const distanceMeters = getDistance(
          { latitude: exifLatNum, longitude: exifLonNum },
          { latitude: deviceLatNum, longitude: deviceLonNum }
        );

        // 6. REJECT if photo location is more than 200m from device location
        // BUT: Only check if we have ACTUAL embedded GPS from the photo itself
        // If photo came from gallery without GPS, we trust the device location instead
        if (distanceMeters > 200 && hasRealEmbeddedGPS) {
          return res.status(400).json({
            message:
              `Photo was taken ${distanceMeters.toFixed(0)}m away from reported location. ` +
              `Photo GPS: (${exifLatNum.toFixed(6)}, ${exifLonNum.toFixed(6)}), ` +
              `Reported: (${deviceLatNum.toFixed(6)}, ${deviceLonNum.toFixed(6)}). ` +
              `Please use a photo taken at the exact location of the issue.`,
          });
        }
      } catch (exifErr) {
        console.error('⚠️  EXIF read error:', exifErr.message);
        return res.status(400).json({
          message:
            'Unable to read photo metadata. Please capture a new photo with your device camera.',
        });
      }
    }

    // ==================== pHash DUPLICATE DETECTION ====================
    // Compute pHash for the uploaded image and check for duplicates
    let phash = null;
    if (req.file) {
      try {
        const uploadedPath =
          req.file.path ||
          path.join(__dirname, '../../uploads', req.file.filename);

        phash = await computePHash(uploadedPath);

        // Fetch all existing pHashes from the database
        const existingIssues = await Issue.findAll({
          attributes: ['id', 'phash'],
          where: { phash: { [require('sequelize').Op.ne]: null } },
        });

        // Find similar images (>= 85% similarity)
        // 85% = ~10 bits different out of 64, allows for minor cropping/compression
        const SIMILARITY_THRESHOLD = 80;
        const similarImages = findSimilarImages(
          phash,
          existingIssues,
          SIMILARITY_THRESHOLD
        );

        if (similarImages.length > 0) {
          const duplicateInfo = similarImages.map((img) => ({
            issueId: img.id,
            similarity: img.similarity.toFixed(1),
          }));

          // REJECT duplicate images - don't allow the upload
          return res.status(400).json({
            message:
              '❌ This image appears to be a duplicate of an existing report. ' +
              'Please check if this pothole has already been reported.',
            duplicateInfo: duplicateInfo,
            action:
              'Please upload a different photo or check existing reports before submitting.',
          });
        }
      } catch (phashErr) {
        // If pHash computation fails, log but don't block the upload
        console.warn('⚠️  pHash computation failed:', phashErr.message);
        // We don't set needs_review here - let EXIF validation handle it
      }
    }

    const issue = await Issue.create({
      title,
      description,
      photo_url: photoUrl,
      latitude,
      longitude,
      address,
      status,
      needs_review: false, // Only valid potholes reach here
      phash,
      ai_verified: ai_verified !== null ? ai_verified : true, // If no AI check, assume verified
      ai_confidence: ai_confidence,
      ai_label: ai_label || 'pothole',
    });
    
    logger.success('Issue created', { id: issue.id });
    return res.status(201).json(issue);
  } catch (error) {
    logger.error('CREATE ISSUE ERROR', {
      message: error.message,
      stack: error.stack,
    });
    return next(error);
  }
};

const getIssues = async (req, res, next) => {
  try {
    const issues = await Issue.findAll({ order: [['created_at', 'DESC']] });
    return res.json(issues);
  } catch (error) {
    return next(error);
  }
};

const getIssueById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const issue = await Issue.findByPk(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    return res.json(issue);
  } catch (error) {
    return next(error);
  }
};

const updateIssue = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    // Only enforce validation errors if there's no file upload.
    // When uploading a file, we skip strict field validation since
    // multipart form fields may not serialize the same way as JSON.
    if (!errors.isEmpty() && !req.file) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const issue = await Issue.findByPk(id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // req.body may be undefined when the request is multipart/form-data
    // (for example when uploading a file only). Safely default to an
    // empty object so destructuring doesn't throw.
    const body = req.body || {};
    let { title, description, photo_url, latitude, longitude, status } = body;

    // When status is sent as a multipart form field, it may be a string.
    // Ensure we're comparing against the correct value.
    if (typeof status === 'string') {
      status = status.trim();
    }

    // Build updates from provided fields
    const updates = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(photo_url !== undefined && { photo_url }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(status !== undefined && { status }),
    };

    // If a file was uploaded (multipart request), construct the public URL
    // and include it in the updates. This keeps the update logic compatible
    // with both JSON and multipart/form-data requests.
    if (req.file) {
      let host = req.get('host');
      if (process.env.API_HOST) {
        host = process.env.API_HOST;
      }
      const protocol =
        process.env.API_PROTOCOL ||
        req.protocol ||
        req.headers['x-forwarded-proto'] ||
        'http';
      const uploadedUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

      // Determine if this should be stored as a resolved photo.
      // Check: (1) if status is being set to Resolved in this request,
      // or (2) if the issue is already Resolved in the database.
      const statusToCheck = status || issue.status;
      const willBeResolved = statusToCheck === 'Resolved';

      if (willBeResolved) {
        updates.resolved_photo_url = uploadedUrl;
      } else {
        updates.photo_url = uploadedUrl;
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    if (updates.status && !statuses.includes(updates.status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }

    await issue.update(updates);
    return res.json(issue);
  } catch (error) {
    return next(error);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const deleted = await Issue.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
};
