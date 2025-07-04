export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score: number;
}

export interface PoseDetectionStats {
  fps: number;
  frameCount: number;
  poseCount: number;
  avgConfidence: number;
}