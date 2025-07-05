import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Pose } from '@/types/pose';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PoseCanvasProps {
  poses: Pose[];
  cameraFacing?: 'front' | 'back';
  cameraLayout?: { width: number; height: number };
  showConfidence?: boolean;
  showKeypoints?: boolean;
}

const PoseCanvas: React.FC<PoseCanvasProps> = ({ 
  poses, 
  cameraFacing = 'back', 
  cameraLayout = { width: screenWidth, height: screenHeight }, 
  showConfidence = false, 
  showKeypoints = true 
}) => {
  // MoveNet keypoint connections for drawing skeleton
  const connections = [
    // Head connections
    [0, 1], [0, 2], [1, 3], [2, 4], // nose to eyes, eyes to ears
    // Torso connections
    [5, 6], [5, 11], [6, 12], [11, 12], // shoulders to hips
    // Left arm
    [5, 7], [7, 9], // left shoulder to elbow to wrist
    // Right arm
    [6, 8], [8, 10], // right shoulder to elbow to wrist
    // Left leg
    [11, 13], [13, 15], // left hip to knee to ankle
    // Right leg
    [12, 14], [14, 16], // right hip to knee to ankle
  ];

  // Keypoint names for MoveNet model
  const keypointNames = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
  ];

  const renderPose = (pose: Pose, index: number) => {
    const elements = [];
    
    // Add pose detection confidence indicator
    const avgConfidence = pose.keypoints.reduce((sum, kp) => sum + kp.score, 0) / pose.keypoints.length;
    
    // Draw skeleton connections
    connections.forEach(([startIdx, endIdx], connIdx) => {
      const startPoint = pose.keypoints[startIdx];
      const endPoint = pose.keypoints[endIdx];
      
      // Only draw connection if both keypoints are confident
      if (startPoint && endPoint && startPoint.score > 0.4 && endPoint.score > 0.4) {
        elements.push(
          <Line
            key={`connection-${index}-${connIdx}`}
            x1={startPoint.x}
            y1={startPoint.y}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#00FF88"
            strokeWidth="3"
            strokeOpacity="0.9"
          />
        );
      }
    });
    
    // Draw keypoints
    if (showKeypoints) {
      pose.keypoints.forEach((keypoint, keypointIdx) => {
        if (keypoint.score > 0.4) {
          // Different colors for different body parts
          let pointColor = '#007AFF';
          if (keypointIdx <= 4) pointColor = '#FF3B30'; // Head - red
          else if (keypointIdx <= 6) pointColor = '#30D158'; // Shoulders - green
          else if (keypointIdx <= 10) pointColor = '#007AFF'; // Arms - blue
          else if (keypointIdx <= 12) pointColor = '#FF9500'; // Hips - orange
          else pointColor = '#AF52DE'; // Legs - purple
          
          elements.push(
            <Circle
              key={`keypoint-${index}-${keypointIdx}`}
              cx={keypoint.x}
              cy={keypoint.y}
              r={keypoint.score > 0.7 ? "8" : "6"}
              fill={pointColor}
              stroke="#fff"
              strokeWidth={keypoint.score > 0.7 ? "3" : "2"}
              opacity={keypoint.score}
            />
          );
          
          // Show confidence scores
          if (showConfidence) {
            elements.push(
              <SvgText
                key={`confidence-${index}-${keypointIdx}`}
                x={keypoint.x + 8}
                y={keypoint.y - 8}
                fontSize="12"
                fill="#fff"
                stroke="#000"
                strokeWidth="1"
                fontWeight="bold"
              >
                {Math.round(keypoint.score * 100)}%
              </SvgText>
            );
          }
        }
      });
    }
    
    // Add overall confidence indicator
    if (avgConfidence > 0.5) {
      elements.push(
        <SvgText
          key={`overall-confidence-${index}`}
          x="20"
          y="40"
          fontSize="16"
          fill={avgConfidence > 0.7 ? "#30D158" : "#FF9500"}
          stroke="#000"
          strokeWidth="1"
          fontWeight="bold"
        >
          {Math.round(avgConfidence * 100)}% confidence
        </SvgText>
      );
    }
    
    return elements;
  };

  if (poses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Svg
        width={cameraLayout.width}
        height={cameraLayout.height}
        style={styles.svg}
      >
        {poses.map((pose, index) => renderPose(pose, index))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default PoseCanvas;