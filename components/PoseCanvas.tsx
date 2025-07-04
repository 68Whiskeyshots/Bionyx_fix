import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Pose } from '@/types/pose';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PoseCanvasProps {
  poses: Pose[];
  showConfidence?: boolean;
  showKeypoints?: boolean;
}

export function PoseCanvas({ poses, showConfidence = true, showKeypoints = true }: PoseCanvasProps) {
  const connections = [
    // Head
    [0, 1], [1, 3], [0, 2], [2, 4],
    // Body
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
    [5, 11], [6, 12], [11, 12],
    // Legs
    [11, 13], [13, 15], [12, 14], [14, 16],
  ];

  const renderPose = (pose: Pose, index: number) => {
    const elements = [];
    
    // Draw connections
    connections.forEach(([startIdx, endIdx], connIdx) => {
      const startPoint = pose.keypoints[startIdx];
      const endPoint = pose.keypoints[endIdx];
      
      if (startPoint && endPoint && startPoint.score > 0.3 && endPoint.score > 0.3) {
        elements.push(
          <Line
            key={`connection-${index}-${connIdx}`}
            x1={startPoint.x}
            y1={startPoint.y}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#007AFF"
            strokeWidth="2"
            strokeOpacity="0.8"
          />
        );
      }
    });
    
    // Draw keypoints
    if (showKeypoints) {
      pose.keypoints.forEach((keypoint, keypointIdx) => {
        if (keypoint.score > 0.3) {
          elements.push(
            <Circle
              key={`keypoint-${index}-${keypointIdx}`}
              cx={keypoint.x}
              cy={keypoint.y}
              r="4"
              fill="#007AFF"
              stroke="#fff"
              strokeWidth="2"
            />
          );
          
          // Show confidence scores
          if (showConfidence) {
            elements.push(
              <SvgText
                key={`confidence-${index}-${keypointIdx}`}
                x={keypoint.x + 8}
                y={keypoint.y - 8}
                fontSize="10"
                fill="#fff"
                stroke="#000"
                strokeWidth="0.5"
              >
                {Math.round(keypoint.score * 100)}%
              </SvgText>
            );
          }
        }
      });
    }
    
    return elements;
  };

  if (poses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Svg
        width={screenWidth}
        height={screenHeight}
        style={styles.svg}
      >
        {poses.map((pose, index) => renderPose(pose, index))}
      </Svg>
    </View>
  );
}

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