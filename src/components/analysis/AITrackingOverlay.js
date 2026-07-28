"use client";

import React, { useRef, useEffect, useState } from 'react';

export default function AITrackingOverlay({ trackingData, currentTime, playerHeight = 1.75, videoWidth = 1280, videoHeight = 720 }) {
  const canvasRef = useRef(null);
  const FPS = 30.0; // Standard FPS approximation
  const TRAIL_SECONDS = 5;
  const TRAIL_LENGTH = Math.floor(FPS * TRAIL_SECONDS);

  // Configuration colors
  const COLOR_COG = "rgba(230, 50, 50, 1)"; // Red
  const COLOR_COG_TRAIL = [230, 50, 50];
  const COLOR_BALL = "rgba(30, 160, 220, 1)"; // Blue
  const COLOR_BALL_TRAIL = [30, 160, 220];
  const COLOR_EXOSKELETON = "rgba(255, 255, 255, 0.9)"; // White

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trackingData) return;
    
    // Set actual canvas size to match video resolution for accurate drawing
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate current frame
    const currentFrame = Math.floor(currentTime * FPS) + 1;
    
    // Convert trackingData (object keyed by frame strings like "3", "6") into an array sorted by frame number
    const frameKeys = Object.keys(trackingData).map(Number).sort((a, b) => a - b);
    if (frameKeys.length === 0) return;
    
    // Find the current frame data (the closest one at or before current time)
    let currentDataKey = frameKeys[0];
    for (let i = 0; i < frameKeys.length; i++) {
       if (frameKeys[i] <= currentFrame) {
          currentDataKey = frameKeys[i];
       } else {
          break;
       }
    }
    
    // Gather history for trails
    // We want up to TRAIL_LENGTH frames going backwards from currentDataKey
    const historyFrames = [];
    for (let i = frameKeys.indexOf(currentDataKey); i >= 0; i--) {
       if (currentFrame - frameKeys[i] <= TRAIL_LENGTH) {
          historyFrames.unshift(trackingData[frameKeys[i]]);
       } else {
          break;
       }
    }
    
    const drawDashedTrail = (points, rgbColor) => {
       if (points.length < 2) return;
       ctx.lineCap = "round";
       ctx.lineJoin = "round";
       ctx.lineWidth = 4;
       ctx.setLineDash([12, 10]); // Proper dashed line
       ctx.strokeStyle = `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, 0.85)`;
       
       ctx.beginPath();
       ctx.moveTo(points[0].x, points[0].y);
       for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
       }
       ctx.stroke();
       ctx.setLineDash([]); // Reset dash
    };

    const drawExoskeleton = (kps) => {
       if (!kps || Object.keys(kps).length === 0) return;
       
       const getPt = (name) => {
          const p = kps[name];
          // Confidence check >= 0.15
          if (p && p[2] >= 0.15) return { x: p[0], y: p[1] };
          return null;
       };
       
       const ls = getPt("l_shoulder"), rs = getPt("r_shoulder");
       const le = getPt("l_elbow"),    re = getPt("r_elbow");
       const lw = getPt("l_wrist"),    rw = getPt("r_wrist");
       const lh = getPt("l_hip"),      rh = getPt("r_hip");
       const lk = getPt("l_knee"),     rk = getPt("r_knee");
       const la = getPt("l_ankle"),    ra = getPt("r_ankle");
       
       ctx.strokeStyle = COLOR_EXOSKELETON;
       ctx.lineWidth = 3;
       ctx.lineCap = "round";
       
       const pairs = [
          [ls, le], [le, lw], // Left arm
          [rs, re], [re, rw], // Right arm
          [ls, rs],           // Shoulders
          [ls, lh], [rs, rh], // Torso
          [lh, rh],           // Hips
          [lh, lk], [lk, la], // Left leg
          [rh, rk], [rk, ra]  // Right leg
       ];
       
       ctx.beginPath();
       pairs.forEach(([p1, p2]) => {
          if (p1 && p2) {
             ctx.moveTo(p1.x, p1.y);
             ctx.lineTo(p2.x, p2.y);
          }
       });
       ctx.stroke();
       
       // Draw joint dots
       ctx.fillStyle = COLOR_EXOSKELETON;
       [ls, rs, le, re, lw, rw, lh, rh, lk, rk, la, ra].forEach(pt => {
          if (pt) {
             ctx.beginPath();
             ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
             ctx.fill();
          }
       });
    };

    const currentData = trackingData[currentDataKey];
    if (!currentData) return;
    
    // --- Draw Players ---
    const players = currentData.players || [];
    
    // Extract player trails from history
    const playerTrails = {};
    historyFrames.forEach(frame => {
       (frame.players || []).forEach(p => {
          if (p.cog) {
             if (!playerTrails[p.id]) playerTrails[p.id] = [];
             playerTrails[p.id].push({ x: p.cog[0], y: p.cog[1] });
          }
       });
    });
    
    players.forEach(p => {
       // Draw CoG trail
       if (playerTrails[p.id]) {
          drawDashedTrail(playerTrails[p.id], COLOR_COG_TRAIL);
       }
       
       // Draw Exoskeleton
       if (p.keypoints) {
          drawExoskeleton(p.keypoints);
       }
       
       // Draw CoG Marker
       if (p.cog) {
          ctx.beginPath();
          ctx.arc(p.cog[0], p.cog[1], 8, 0, Math.PI * 2);
          ctx.strokeStyle = COLOR_COG;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(p.cog[0], p.cog[1], 4, 0, Math.PI * 2);
          ctx.fillStyle = "white";
          ctx.fill();
       }
    });

    // --- Draw Ball ---
    const ballTrails = [];
    historyFrames.forEach(frame => {
       if (frame.ball && frame.ball.center) {
          ballTrails.push({ x: frame.ball.center[0], y: frame.ball.center[1] });
       }
    });
    
    if (ballTrails.length > 0) {
       drawDashedTrail(ballTrails, COLOR_BALL_TRAIL);
    }
    
    if (currentData.ball && currentData.ball.center) {
       ctx.beginPath();
       ctx.arc(currentData.ball.center[0], currentData.ball.center[1], 6, 0, Math.PI * 2);
       ctx.fillStyle = COLOR_BALL;
       ctx.fill();
    }
    
  }, [trackingData, currentTime, videoWidth, videoHeight]);

  return (
    <canvas 
      ref={canvasRef}
      style={{ 
        pointerEvents: "none", 
        position: "absolute", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "100%", 
        zIndex: 15 
      }} 
    />
  );
}

