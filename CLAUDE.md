# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time pose detection application built with React Native, Expo SDK 53, and TensorFlow.js. It uses the MoveNet SinglePose Lightning model to detect human poses through device camera feed and renders keypoints as SVG overlays.

## Key Commands

```bash
expo start                    # Start development server with QR code
expo start --android          # Run on Android device/emulator  
expo start --ios              # Run on iOS device/simulator
expo start --web              # Run in web browser
yarn                          # Install dependencies
```

## Architecture

### Core Components
- **App.tsx**: Main application component containing the complete pose detection pipeline
- **TensorCamera**: Wrapper around expo-camera created via `cameraWithTensors()` that provides direct tensor streams
- **Offline Model**: Bundled MoveNet Lightning model files in `offline_model/` directory

### TensorFlow.js Integration
- **Model Loading**: Uses `bundleResourceIO()` to load offline TensorFlow model from bundled assets
- **Backends**: Imports WebGL and CPU backends for cross-platform compatibility
- **Tensor Processing**: Direct camera tensor stream processing without intermediate image conversion

### Camera System
- **Platform Handling**: Different aspect ratios (iOS: 16:9, Android: 4:3) and rotation logic
- **Coordinate Transformation**: Converts tensor coordinates to screen coordinates with platform-specific mirroring
- **Manual Rendering**: Uses `AUTO_RENDER = false` with manual `updatePreview()` and `gl.endFrameEXP()` calls

### Key Configuration Constants
- `OUTPUT_TENSOR_WIDTH = 180` - Input tensor width for model
- `OUTPUT_TENSOR_HEIGHT` - Calculated based on platform aspect ratio  
- `MIN_KEYPOINT_SCORE = 0.3` - Confidence threshold for rendering keypoints
- `LOAD_MODEL_FROM_BUNDLE = true` - Enables offline model loading

## Metro Bundler Configuration

The `metro.config.js` extends default Expo config to handle binary model files:
- Adds `.bin` extension to `assetExts` for bundling TensorFlow model weights
- Essential for offline model loading with `bundleResourceIO()`

## Model Architecture

Uses MoveNet SinglePose Lightning model:
- **Input**: 180x180 (or calculated height) RGB tensor from camera
- **Output**: 17 body keypoints with x,y coordinates and confidence scores
- **Loading**: Bundled model.json + binary weight shards (group1-shard1of2.bin, group1-shard2of2.bin)

## Platform-Specific Behavior

### iOS
- 16:9 aspect ratio for camera preview
- Manual texture rotation based on device orientation
- Front camera mirroring in landscape mode

### Android  
- 4:3 aspect ratio for camera preview
- Automatic texture rotation (no manual rotation needed)
- Consistent horizontal flipping logic

## Orientation and Coordinate Systems

The app handles orientation changes through:
- `ScreenOrientation` listeners for device rotation
- Dynamic tensor dimension swapping (`getOutputTensorWidth/Height()`)
- Platform-specific rotation angles (`getTextureRotationAngleInDegrees()`)
- Coordinate scaling from tensor space to screen space

## Performance Considerations

- Uses `requestAnimationFrame()` loop with manual tensor disposal
- Direct tensor processing without intermediate image conversion
- Hardware-accelerated WebGL backend when available
- Efficient SVG rendering for keypoints overlay