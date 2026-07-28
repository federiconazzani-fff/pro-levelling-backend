import React from 'react';
import { haptic } from "@/utils/haptics";

const rolesConfig = [
  { id: 'LW', label: 'LW', x: 20, y: 18 },
  { id: 'ST', label: 'ST', x: 50, y: 15 },
  { id: 'RW', label: 'RW', x: 80, y: 18 },
  
  { id: 'LM', label: 'LM', x: 20, y: 40 },
  { id: 'CM', label: 'CM', x: 50, y: 40 },
  { id: 'RM', label: 'RM', x: 80, y: 40 },
  
  { id: 'CDM', label: 'CDM', x: 50, y: 55 },
  
  { id: 'LB', label: 'LB', x: 20, y: 72 },
  { id: 'CB', label: 'CB', x: 50, y: 75 },
  { id: 'RB', label: 'RB', x: 80, y: 72 },
  
  { id: 'GK', label: 'GK', x: 50, y: 90 },
];

export default function FootballPitchSelector({ selectedRole, onSelectRole }) {
  const lineColor = 'rgba(17, 17, 17, 0.15)'; // Dark lines for light background
  
  return (
    <div style={{
      width: '100%',
      maxWidth: '240px',
      margin: '0 auto 20px auto',
      position: 'relative'
    }}>
      <div style={{
        width: '100%',
        paddingBottom: '150%', // Height is 360px if width is 240px
        position: 'relative',
        background: 'transparent',
      }}>
        {/* Inner Pitch Field with boundaries */}
        <div style={{
          position: 'absolute',
          top: '16px',
          bottom: '16px',
          left: '12px',
          right: '12px',
          border: `2px solid ${lineColor}`,
          borderRadius: '4px',
          background: 'transparent'
        }}>
          {/* Goals (Porte) - Protruding outside the boundaries */}
          {/* Top Goal */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: '35%',
            width: '30%',
            height: '6px',
            border: `2px solid ${lineColor}`,
            borderBottom: 'none',
            background: '#ffffff',
            zIndex: 1
          }} />
          {/* Bottom Goal */}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '35%',
            width: '30%',
            height: '6px',
            border: `2px solid ${lineColor}`,
            borderTop: 'none',
            background: '#ffffff',
            zIndex: 1
          }} />

          {/* Corner Arcs (Lunette dei calci d'angolo) */}
          {/* Top Left */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '8px', borderRight: `1.5px solid ${lineColor}`, borderBottom: `1.5px solid ${lineColor}`, borderBottomRightRadius: '100%' }} />
          {/* Top Right */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', borderLeft: `1.5px solid ${lineColor}`, borderBottom: `1.5px solid ${lineColor}`, borderBottomLeftRadius: '100%' }} />
          {/* Bottom Left */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '8px', height: '8px', borderRight: `1.5px solid ${lineColor}`, borderTop: `1.5px solid ${lineColor}`, borderTopRightRadius: '100%' }} />
          {/* Bottom Right */}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '8px', height: '8px', borderLeft: `1.5px solid ${lineColor}`, borderTop: `1.5px solid ${lineColor}`, borderTopLeftRadius: '100%' }} />

          {/* Center Spot (Dischetto di centrocampo) */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '4px', background: lineColor, borderRadius: '50%', zIndex: 1 }} />

          {/* Penalty Spots (Dischetti del rigore) */}
          {/* Top Penalty Spot */}
          <div style={{ position: 'absolute', top: '11%', left: '50%', transform: 'translate(-50%, -50%)', width: '3px', height: '3px', background: lineColor, borderRadius: '50%', zIndex: 1 }} />
          {/* Bottom Penalty Spot */}
          <div style={{ position: 'absolute', bottom: '11%', left: '50%', transform: 'translate(-50%, -50%)', width: '3px', height: '3px', background: lineColor, borderRadius: '50%', zIndex: 1 }} />

          {/* Pitch Lines */}
          {/* Center Line */}
          <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', background: lineColor }} />
          {/* Center Circle */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '30%', aspectRatio: '1', border: `2px solid ${lineColor}`, borderRadius: '50%' }} />
          
          {/* Top Penalty Area */}
          <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '16%', border: `2px solid ${lineColor}`, borderTop: 'none' }} />
          {/* Top Goal Area */}
          <div style={{ position: 'absolute', top: 0, left: '35%', width: '30%', height: '6%', border: `2px solid ${lineColor}`, borderTop: 'none' }} />
          {/* Top Penalty Arc */}
          <div style={{ position: 'absolute', top: '16%', left: '50%', transform: 'translateX(-50%)', width: '20%', height: '8%', border: `2px solid ${lineColor}`, borderRadius: '0 0 50% 50%', borderTop: 'none' }} />

          {/* Bottom Penalty Area */}
          <div style={{ position: 'absolute', bottom: 0, left: '20%', width: '60%', height: '16%', border: `2px solid ${lineColor}`, borderBottom: 'none' }} />
          {/* Bottom Goal Area */}
          <div style={{ position: 'absolute', bottom: 0, left: '35%', width: '30%', height: '6%', border: `2px solid ${lineColor}`, borderBottom: 'none' }} />
          {/* Bottom Penalty Arc */}
          <div style={{ position: 'absolute', bottom: '16%', left: '50%', transform: 'translateX(-50%)', width: '20%', height: '8%', border: `2px solid ${lineColor}`, borderRadius: '50% 50% 0 0', borderBottom: 'none' }} />

          {/* Role Nodes */}
          {rolesConfig.map((role) => {
            const isActive = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectRole(role.id);
                  if (window.haptic) window.haptic.medium();
                }}
                style={{
                  position: 'absolute',
                  left: `${role.x}%`,
                  top: `${role.y}%`,
                  transform: `translate(-50%, -50%) scale(${isActive ? 1.1 : 1})`,
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: isActive ? 'var(--primary)' : '#ffffff',
                  border: isActive ? 'none' : '1px solid rgba(17, 17, 17, 0.2)',
                  color: isActive ? '#fff' : '#111',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: isActive ? '0 6px 12px rgba(230, 57, 70, 0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
                  zIndex: isActive ? 10 : 1
                }}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
