#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CivicFix - Custom Pothole Detection Model
Built from scratch using Python and TensorFlow/Keras
Optimized for quick training and high accuracy
"""

import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split
import cv2
from pathlib import Path
import json
from datetime import datetime
import argparse

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32  # Increased for better generalization with diverse dataset
EPOCHS = 30  # Balanced: good training time with better convergence
LEARNING_RATE = 0.0005  # Lower learning rate for stable training

class PotholeDetectionModel:
    def __init__(self, model_path="pothole_model.keras"):
        self.model_path = model_path
        self.model = None
        self.history = None
        
    def build_model(self):
        """Build CNN architecture from scratch"""
        print("[BUILD] Building custom CNN architecture...")
        
        model = models.Sequential([
            # Input layer
            layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3)),
            
            # Normalization
            layers.Rescaling(1./255),
            
            # Enhanced data augmentation for diverse indoor/outdoor surfaces
            layers.RandomFlip("horizontal"),  # Only horizontal flip (don't distort potholes)
            layers.RandomRotation(0.15),  # Reduced from 0.2
            layers.RandomZoom(0.15),  # Reduced from 0.2
            
            # First block
            layers.Conv2D(32, (3, 3), padding='same', activation='relu'),
            layers.BatchNormalization(),
            layers.Conv2D(32, (3, 3), padding='same', activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.3),
            
            # Second block
            layers.Conv2D(64, (3, 3), padding='same', activation='relu'),
            layers.BatchNormalization(),
            layers.Conv2D(64, (3, 3), padding='same', activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.3),
            
            # Third block
            layers.Conv2D(128, (3, 3), padding='same', activation='relu'),
            layers.BatchNormalization(),
            layers.Conv2D(128, (3, 3), padding='same', activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.4),
            
            # Fourth block
            layers.Conv2D(256, (3, 3), padding='same', activation='relu'),
            layers.BatchNormalization(),
            layers.Conv2D(256, (3, 3), padding='same', activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.4),
            
            # Global pooling
            layers.GlobalAveragePooling2D(),
            
            # Dense layers
            layers.Dense(512, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.5),
            
            layers.Dense(256, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.4),
            
            # Output layer
            layers.Dense(1, activation='sigmoid')
        ])
        
        # Compile model
        optimizer = keras.optimizers.Adam(learning_rate=LEARNING_RATE)
        model.compile(
            optimizer=optimizer,
            loss='binary_crossentropy',
            metrics=['accuracy', 
                    keras.metrics.Precision(name='precision'),
                    keras.metrics.Recall(name='recall'),
                    keras.metrics.AUC(name='auc')]
        )
        
        self.model = model
        print("[OK] Model built successfully!")
        print(f"[INFO] Total parameters: {model.count_params():,}")
        return model
    
    def load_images_from_folder(self, folder_path, label):
        """Load and preprocess images from folder with aspect ratio preservation"""
        images = []
        labels = []
        
        valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
        
        for file in os.listdir(folder_path):
            if Path(file).suffix.lower() in valid_extensions:
                try:
                    img_path = os.path.join(folder_path, file)
                    img = cv2.imread(img_path)
                    
                    if img is None:
                        print(f"[WARN] Could not load: {file}")
                        continue
                    
                    # Preserve aspect ratio by padding instead of stretching
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    h, w = img.shape[:2]
                    
                    # Calculate scale to fit into IMG_SIZE while preserving aspect ratio
                    scale = IMG_SIZE / max(h, w)
                    new_h, new_w = int(h * scale), int(w * scale)
                    
                    # Resize with interpolation
                    img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
                    
                    # Create padded image
                    padded = np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)
                    y_offset = (IMG_SIZE - new_h) // 2
                    x_offset = (IMG_SIZE - new_w) // 2
                    padded[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = img
                    
                    images.append(padded)
                    labels.append(label)
                except Exception as e:
                    print(f"[WARN] Error processing {file}: {e}")
        
        return np.array(images, dtype=np.float32), np.array(labels)
    
    def prepare_dataset(self, data_dir):
        """Prepare training dataset"""
        print("\n[LOAD] Loading dataset...")
        
        pothole_dir = os.path.join(data_dir, 'pothole')
        not_pothole_dir = os.path.join(data_dir, 'not_pothole')
        
        if not os.path.exists(pothole_dir) or not os.path.exists(not_pothole_dir):
            print("[ERROR] Dataset folders not found!")
            print(f"   Expected: {pothole_dir}/")
            print(f"   Expected: {not_pothole_dir}/")
            return None, None, None, None
        
        # Load pothole images (label = 1)
        print(f"[LOAD] Loading pothole images from: {pothole_dir}")
        X_pothole, y_pothole = self.load_images_from_folder(pothole_dir, 1)
        print(f"[OK] Loaded {len(X_pothole)} pothole images")
        
        # Load non-pothole images (label = 0)
        print(f"[LOAD] Loading non-pothole images from: {not_pothole_dir}")
        X_not_pothole, y_not_pothole = self.load_images_from_folder(not_pothole_dir, 0)
        print(f"[OK] Loaded {len(X_not_pothole)} non-pothole images")
        
        # Combine datasets
        X = np.vstack([X_pothole, X_not_pothole])
        y = np.hstack([y_pothole, y_not_pothole])
        
        print(f"\n[INFO] Total samples: {len(X)}")
        print(f"   Potholes: {np.sum(y)} ({np.sum(y)/len(y)*100:.1f}%)")
        print(f"   Non-potholes: {len(y) - np.sum(y)} ({(1-np.sum(y)/len(y))*100:.1f}%)")
        
        # Split dataset
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
        )
        
        print(f"\n[INFO] Dataset split:")
        print(f"   Training: {len(X_train)} samples")
        print(f"   Validation: {len(X_val)} samples")
        print(f"   Testing: {len(X_test)} samples")
        
        return (X_train, y_train), (X_val, y_val), (X_test, y_test), (X, y)
    
    def train(self, data_dir, epochs=EPOCHS):
        """Train the model"""
        print("\n[START] Starting training...")
        
        # Prepare dataset
        train_data, val_data, test_data, full_data = self.prepare_dataset(data_dir)
        
        if train_data is None:
            return False
        
        X_train, y_train = train_data
        X_val, y_val = val_data
        X_test, y_test = test_data
        
        # Calculate class weights to handle imbalance
        # More non-potholes, so give potholes higher weight
        n_potholes = np.sum(y_train)
        n_non_potholes = len(y_train) - n_potholes
        class_weight = {0: n_potholes / n_non_potholes, 1: 1.0}
        print(f"\n[INFO] Class weights: {class_weight}")
        
        # Build model if not already built
        if self.model is None:
            self.build_model()
        
        # Callbacks
        early_stop = keras.callbacks.EarlyStopping(
            monitor='val_auc',  # Monitor AUC instead of loss for better metrics
            patience=8,
            restore_best_weights=True,
            verbose=1,
            mode='max'
        )
        
        reduce_lr = keras.callbacks.ReduceLROnPlateau(
            monitor='val_auc',
            factor=0.5,
            patience=4,
            min_lr=1e-7,
            verbose=1,
            mode='max'
        )
        
        # Train
        print("\n[TRAIN] Training model...")
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=BATCH_SIZE,
            callbacks=[early_stop, reduce_lr],
            class_weight=class_weight,  # Handle class imbalance
            verbose=1
        )
        
        # Evaluate on test set
        print("\n[EVAL] Evaluating on test set...")
        test_loss, test_acc, test_precision, test_recall, test_auc = self.model.evaluate(
            X_test, y_test, verbose=0
        )
        
        print(f"\n[RESULT] Test Results:")
        print(f"   Loss: {test_loss:.4f}")
        print(f"   Accuracy: {test_acc:.4f} ({test_acc*100:.1f}%)")
        print(f"   Precision: {test_precision:.4f}")
        print(f"   Recall: {test_recall:.4f}")
        print(f"   AUC: {test_auc:.4f}")
        
        # Save model
        self.save_model(test_acc, test_precision, test_recall)
        
        return True
    
    def save_model(self, accuracy, precision, recall):
        """Save trained model using native Keras format"""
        # Use .keras format instead of .h5 to avoid serialization issues
        keras_path = self.model_path.replace('.h5', '.keras')
        print(f"\n[SAVE] Saving model to: {keras_path}")
        
        try:
            self.model.save(keras_path)
            print(f"[OK] Model saved successfully!")
            print(f"   Model: {keras_path}")
        except Exception as e:
            print(f"[WARN] Failed to save as .keras: {e}")
            print(f"[SAVE] Attempting to save as .h5...")
            try:
                self.model.save(self.model_path, save_format='tf')
                print(f"[OK] Model saved as: {self.model_path}")
            except Exception as e2:
                print(f"[ERROR] Failed to save model: {e2}")
                return
        
        # Save metadata
        metadata = {
            'timestamp': datetime.now().isoformat(),
            'model_path': keras_path,
            'image_size': IMG_SIZE,
            'batch_size': BATCH_SIZE,
            'test_accuracy': float(accuracy),
            'test_precision': float(precision),
            'test_recall': float(recall),
            'architecture': 'Custom CNN (4 conv blocks + data augmentation)'
        }
        
        metadata_path = keras_path.replace('.keras', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"   Metadata: {metadata_path}")
    
    def load_model(self):
        """Load trained model"""
        if os.path.exists(self.model_path):
            print(f"[LOAD] Loading model from: {self.model_path}")
            self.model = keras.models.load_model(self.model_path)
            print("[OK] Model loaded successfully!")
            return True
        else:
            print(f"[ERROR] Model not found: {self.model_path}")
            return False
    
    def predict_image(self, image_path):
        """Predict pothole in single image"""
        if self.model is None:
            self.load_model()
        
        # Load and preprocess image
        img = cv2.imread(image_path)
        if img is None:
            print(f"[ERROR] Could not load image: {image_path}")
            return None
        
        img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.astype(np.float32)  # Don't normalize - model does it
        
        # Predict
        prediction = self.model.predict(np.array([img]), verbose=0)
        confidence = float(prediction[0][0])
        is_pothole = confidence > 0.65  # Optimized threshold to reduce false positives on indoor surfaces
        
        return {
            'is_pothole': is_pothole,
            'confidence': confidence,
            'percentage': f"{confidence*100:.1f}%"
        }

def main():
    parser = argparse.ArgumentParser(
        description='CivicFix Pothole Detection Model - Python Implementation'
    )
    parser.add_argument('--train', action='store_true', help='Train the model')
    parser.add_argument('--predict', type=str, help='Predict pothole in image')
    parser.add_argument('--data-dir', type=str, default='dataset', 
                       help='Path to training dataset')
    parser.add_argument('--model', type=str, default='pothole_model.keras',
                       help='Path to model file')
    parser.add_argument('--epochs', type=int, default=EPOCHS,
                       help='Number of epochs to train')
    
    args = parser.parse_args()
    
    model = PotholeDetectionModel(model_path=args.model)
    
    if args.train:
        print("="*50)
        print("[TRAIN] CivicFix Pothole Detection - Training Mode")
        print("="*50)
        model.train(args.data_dir, epochs=args.epochs)
    
    elif args.predict:
        print("="*50)
        print("[PREDICT] CivicFix Pothole Detection - Prediction Mode")
        print("="*50)
        result = model.predict_image(args.predict)
        if result:
            print(f"\n[RESULT] Prediction Result:")
            print(f"   Is Pothole: {'YES' if result['is_pothole'] else 'NO'}")
            print(f"   Confidence: {result['percentage']}")
    
    else:
        print("="*50)
        print("[INFO] CivicFix Pothole Detection Model")
        print("="*50)
        print("\nUsage:")
        print("  Training:  python pothole_model.py --train --data-dir ./dataset")
        print("  Training (custom epochs):  python pothole_model.py --train --data-dir ./dataset --epochs 50")
        print("  Predict:   python pothole_model.py --predict ./image.jpg")
        print("  Help:      python pothole_model.py --help")

if __name__ == '__main__':
    main()
