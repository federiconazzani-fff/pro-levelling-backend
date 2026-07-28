"use client";

import React, { useRef, useState, useEffect } from 'react';
import styles from './AIVideoPlayer.module.css';

export default function AIVideoPlayer({ videoSrc, trackingData, playerHeight = 1.75 }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  const [currentFrame, setCurrentFrame] = useState(1);
  const [activePlayers, setActivePlayers] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  
  const FPS = 41.066;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let animationFrameId;

    const renderLoop = () => {
      const frameNum = Math.floor(video.currentTime * FPS) + 1;
      setCurrentFrame(prev => {
        if (prev !== frameNum) {
          updatePlayersForFrame(frameNum);
          return frameNum;
        }
        return prev;
      });
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    const handlePlay = () => animationFrameId = requestAnimationFrame(renderLoop);
    
    const handlePause = () => {
      cancelAnimationFrame(animationFrameId);
      const frameNum = Math.floor(video.currentTime * FPS) + 1;
      setCurrentFrame(frameNum);
      updatePlayersForFrame(frameNum);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handlePause); 

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handlePause);
      cancelAnimationFrame(animationFrameId);
    };
  }, [trackingData, playerHeight]);

  const updatePlayersForFrame = (frameNum) => {
    if (!trackingData) return;
    
    const playersInFrame = [];
    Object.keys(trackingData).forEach(id => {
      const frames = trackingData[id];
      const currentData = frames.find(f => f.frame === frameNum);
      
      if (currentData) {
        // MAGIC MATH: Zero-Click Biometric Calibration
        const bodyLengthsPerFrame = currentData.distance_body_lengths || 0;
        const speedMetersPerFrame = bodyLengthsPerFrame * playerHeight;
        const speedMetersPerSec = speedMetersPerFrame * FPS;
        const kmh = speedMetersPerSec * 3.6;
        
        playersInFrame.push({
          id: id,
          realSpeedKmh: kmh,
          ...currentData
        });
      }
    });
    
    setActivePlayers(playersInFrame);
  };

  const handlePlayerClick = (id) => {
    if (focusedId === id) setFocusedId(null);
    else setFocusedId(id);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      
      <video 
        ref={videoRef}
        src={videoSrc}
        className={styles.video}
        controls
        muted
        playsInline
      />
      
      <div className={styles.overlayContainer}>
        {activePlayers.map(player => {
          const isFocused = focusedId === player.id;
          const isOutOfFocus = focusedId !== null && !isFocused;
          
          const videoW = videoRef.current ? videoRef.current.videoWidth : 1280;
          const videoH = videoRef.current ? videoRef.current.videoHeight : 720;
          if (!videoW || !videoH) return null;
          
          const leftPercent = (player.x / videoW) * 100;
          const topPercent = (player.y / videoH) * 100;
          
          // Arrotondiamo la velocità reale biometrica
          const displayKmh = player.realSpeedKmh.toFixed(1); 

          if (player.class === "ball") {
             return (
               <div 
                  key={player.id}
                  className={`${styles.playerNode} ${isOutOfFocus ? styles.outOfFocus : ''}`}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
               >
                 <div className={styles.ballMarker}></div>
                 <div className={styles.metricText} style={{ color: '#22c55e' }}>
                   {displayKmh} km/h
                 </div>
               </div>
             );
          }

          if (isOutOfFocus) {
             return (
               <div 
                  key={player.id}
                  className={`${styles.playerNode} ${styles.outOfFocus}`}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  onClick={() => handlePlayerClick(player.id)}
               >
                 <div className={styles.feetRing}></div>
               </div>
             );
          }

          return (
            <div 
              key={player.id}
              className={`${styles.playerNode}`}
              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
              onClick={() => handlePlayerClick(player.id)}
            >
              <div className={styles.feetRing}></div>
              <div className={styles.idBox}>{player.id}</div>
              <div className={styles.metricText}>
                {displayKmh} km/h
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
