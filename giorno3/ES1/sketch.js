let letters = [];
let word = "pulse";
let baseSize = 250; // dimensione base
let minSize = 200;
let maxSize = 400;
let hueValue = 0;
let pulseIntensity = 0; // intensità globale della pulsazione
let activeLetter = null; // lettera attualmente attiva
let pulseWave = []; // onde di pulsazione

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('Georgia');
  textAlign(CENTER, CENTER);

  // Calcolo posizione finale della parola "pulse" centrata
  let letterSpacing = 180; // lettere più vicine
  let totalWidth = (word.length - 1) * letterSpacing;
  let startX = width / 2 - totalWidth / 2;
  let centerY = height / 2;

  for (let i = 0; i < word.length; i++) {
    letters.push({
      char: word[i],
      x: startX + i * letterSpacing,
      y: centerY,
      targetX: startX + i * letterSpacing,
      targetY: centerY,
      vx: 0,
      vy: 0,
      size: baseSize,
      pulseBoost: 0, // variabile aggiuntiva per pulsazione extra
      activeTimer: 0, // timer per effetto di attivazione
      pulseFrequency: 0.15 + i * 0.03, // frequenza di pulsazione unica per ogni lettera
      isSuperActive: false, // stato di iper-attivazione
      shockwaveTimer: 0, // timer per onde d'urto
      resonance: 0, // livello di risonanza (0-1)
      chaosLevel: 0 // livello di caos (0-1)
    });
  }
}

function draw() {
  // Scia nera trasparente
  background(0, 0, 10, 10);
  hueValue = (hueValue + 1) % 360;
  
  // Aggiorna onde di pulsazione
  updatePulseWaves();

  letters.forEach((letter, index) => {
    let d = dist(mouseX, mouseY, letter.x, letter.y);
    let isMouseOver = d < 200;

    // CALCOLA LIVELLO DI RISONANZA BASATO SULLA DISTANZA
    // Più vicino = più risonanza (1 = massima, 0 = nulla)
    let resonanceLevel = map(d, 0, 200, 1, 0, true);
    resonanceLevel = constrain(resonanceLevel, 0, 1);
    
    // CALCOLA LIVELLO DI CAOS BASATO SULLA DISTANZA
    // Più vicino = più caos
    let chaosLevel = map(d, 0, 200, 1, 0, true);
    chaosLevel = constrain(chaosLevel, 0, 1);
    
    // Aggiorna i valori nella lettera
    letter.resonance = resonanceLevel;
    letter.chaosLevel = chaosLevel;

    if (isMouseOver) { // raggio di repulsione
      // lettere impazziscono vicino al cursore - FORZA BASATA SULLA DISTANZA
      let angle = atan2(letter.y - mouseY, letter.x - mouseX);
      let force = map(d, 0, 200, 40 * chaosLevel, 0); // più caos = più forza
      letter.vx += cos(angle) * force;
      letter.vy += sin(angle) * force;

      // pulsazione extra molto più intensa - BASATA SULLA DISTANZA
      letter.pulseBoost = map(d, 0, 200, 2.5 * chaosLevel, 0);
      
      // attiva l'effetto super pulsante se abbastanza vicino
      if (chaosLevel > 0.3 && !letter.isSuperActive) {
        letter.isSuperActive = true;
        letter.activeTimer = 0;
        activeLetter = index;
        
        // Crea un'onda di pulsazione quando una lettera diventa attiva
        createPulseWave(letter.x, letter.y, chaosLevel);
      }
      
      // Aumenta i timer in base alla vicinanza
      letter.activeTimer += 0.2 * chaosLevel;
      letter.shockwaveTimer += 0.3 * chaosLevel;
      
      // Effetto onde d'urto periodiche - più frequenti se più vicini
      if (letter.shockwaveTimer > 10 / (chaosLevel + 0.5)) {
        createPulseWave(letter.x, letter.y, chaosLevel);
        letter.shockwaveTimer = 0;
      }
      
    } else {
      // se il cursore è lontano, riduci gradualmente gli effetti
      letter.pulseBoost *= 0.92; // riduzione più lenta
      letter.isSuperActive = false;
      letter.activeTimer *= 0.95;
      letter.resonance *= 0.95;
      letter.chaosLevel *= 0.95;
    }

    // attrazione verso posizione originale con effetto "elasticità" influenzata dal caos
    let attractionBase = 0.1;
    let attractionVariation = sin(frameCount * 0.05 + index) * 0.05 * chaosLevel;
    let attraction = attractionBase + attractionVariation;
    
    letter.vx += (letter.targetX - letter.x) * attraction;
    letter.vy += (letter.targetY - letter.y) * attraction;

    // smorzamento variabile per effetto più "vivo" - influenzato dal caos
    let dampingBase = 0.65;
    let dampingVariation = sin(frameCount * 0.03 + index * 0.5) * 0.05 * chaosLevel;
    let damping = dampingBase + dampingVariation;
    
    letter.vx *= damping;
    letter.vy *= damping;

    letter.x += letter.vx;
    letter.y += letter.vy;

    // PULSAZIONE MOLTO PIÙ INTENSA E COMPLESSA - CON RISONANZA DINAMICA
    let basePulse = sin(frameCount * 0.15 + letter.x * 0.01) * 0.3;
    let fastPulse = sin(frameCount * 0.4 + index) * 0.2;
    
    // PULSAZIONE CAOTICA - dipende dalla distanza
    let chaoticPulse = 0;
    if (chaosLevel > 0.1) {
      chaoticPulse = sin(frameCount * (0.5 + chaosLevel * 2) + index * 2) * 0.15 * chaosLevel;
    }
    
    // RISONANZA - dipende dalla distanza
    let resonanceEffect = 0;
    if (resonanceLevel > 0.1) {
      // La risonanza aumenta con la vicinanza e pulsa più intensamente
      resonanceEffect = sin(letter.activeTimer * (3 + resonanceLevel * 5)) * 
                       0.4 * resonanceLevel * resonanceLevel; // quadratica per effetto più forte
    }
    
    // Combinazione di tutte le pulsazioni
    let pulse = (1 + basePulse + fastPulse + chaoticPulse + resonanceEffect) * 
                (1 + letter.pulseBoost * 1.5); // Moltiplicatore aumentato
    
    // Effetto "palpitazione" quando molto vicino al mouse
    if (d < 50) {
      let heartbeatIntensity = map(d, 0, 50, 1, 0);
      let heartbeat = (sin(frameCount * (0.8 + chaosLevel * 0.5)) > 0.7) ? 0.3 * heartbeatIntensity : 0;
      pulse += heartbeat;
    }
    
    letter.size = constrain(baseSize * pulse, minSize, maxSize * 1.2); // Aumentato maxSize

    // DISEGNO CON EFFETTI AGGIUNTIVI - INTENSITÀ BASATA SULLA DISTANZA
    if (letter.isSuperActive && chaosLevel > 0.3) {
      // Effetto glow per lettere attive - più intenso se più vicino
      drawLetterGlow(letter, d, chaosLevel);
      
      // Effetto particelle di energia - più particelle se più vicino
      if (frameCount % max(1, floor(5 / (chaosLevel + 0.1))) === 0) {
        drawEnergyParticles(letter, chaosLevel);
      }
    }

    // disegno lettera principale con colore vibrante - più vibrante se più vicino
    let brightnessBase = 95;
    let brightnessBoost = letter.isSuperActive ? 100 : 95;
    let finalBrightness = brightnessBoost + (brightnessBoost * chaosLevel * 0.2);
    
    let saturationBase = 80;
    let saturationBoost = letter.isSuperActive ? 90 : 80;
    let finalSaturation = saturationBoost + (saturationBoost * chaosLevel * 0.3);
    
    let hueShift = letter.isSuperActive ? 30 * chaosLevel : 0;
    let pulseHue = (hueValue + hueShift) % 360;
    
    fill(pulseHue, finalSaturation, finalBrightness);
    noStroke();
    textSize(letter.size);
    text(letter.char, letter.x, letter.y);
    
    // Effetto "aura" pulsante - più visibile se più vicino
    if (letter.isSuperActive && chaosLevel > 0.2) {
      drawPulseAura(letter, d, chaosLevel);
    }
  });
  
  // Disegna le onde di pulsazione
  drawPulseWaves();
  
  // Debug: mostra livello di caos della lettera più vicina (opzionale, rimuovi se non vuoi)
  // drawChaosDebug();
}

function drawLetterGlow(letter, distance, chaosLevel) {
  // Multipli livelli di glow - intensità basata sul caos
  let glowLayers = floor(8 * chaosLevel);
  let maxGlowSize = letter.size * (1.2 + chaosLevel * 0.3);
  let baseGlowIntensity = map(distance, 0, 200, 40, 5);
  let glowIntensity = baseGlowIntensity * chaosLevel;
  
  for (let i = glowLayers; i > 0; i--) {
    let glowSize = maxGlowSize * (i / glowLayers);
    let alpha = glowIntensity * (i / glowLayers);
    
    fill(hueValue, 40, 100, alpha);
    noStroke();
    textSize(glowSize);
    text(letter.char, letter.x, letter.y);
  }
}

function drawEnergyParticles(letter, chaosLevel) {
  // Particelle di energia che emanano dalla lettera - quantità basata sul caos
  let particleCount = floor(10 * chaosLevel);
  let baseHue = hueValue;
  
  for (let i = 0; i < particleCount; i++) {
    let angle = random(TWO_PI);
    let distance = random(10, letter.size * 0.6 * chaosLevel);
    let particleSize = random(2, 6 * chaosLevel);
    let pulse = sin(frameCount * 0.2 + i) * 0.5 + 0.5;
    
    let px = letter.x + cos(angle) * distance * pulse;
    let py = letter.y + sin(angle) * distance * pulse;
    
    // Particelle più luminose e colorate se più caos
    let particleHue = (baseHue + i * 30 * chaosLevel) % 360;
    let particleAlpha = 30 + 70 * chaosLevel;
    
    fill(particleHue, 70, 100, particleAlpha);
    noStroke();
    ellipse(px, py, particleSize);
  }
}

function drawPulseAura(letter, distance, chaosLevel) {
  // Aura circolare pulsante intorno alla lettera - dimensione basata sul caos
  let auraBaseSize = 1.5;
  let auraPulse = sin(frameCount * (0.3 + chaosLevel * 0.2)) * (0.3 + chaosLevel * 0.2);
  let auraSize = letter.size * (auraBaseSize + auraPulse);
  
  let baseAuraAlpha = map(distance, 0, 200, 60, 10);
  let auraAlpha = baseAuraAlpha * chaosLevel;
  
  // Primo livello di aura
  noFill();
  stroke(hueValue, 60, 100, auraAlpha);
  strokeWeight(2 + chaosLevel * 2);
  ellipse(letter.x, letter.y, auraSize);
  
  // Secondo livello di aura - solo se abbastanza caos
  if (chaosLevel > 0.5) {
    stroke(hueValue, 40, 100, auraAlpha * 0.7);
    strokeWeight(1 + chaosLevel);
    ellipse(letter.x, letter.y, auraSize * (1.1 + chaosLevel * 0.1));
  }
}

function createPulseWave(x, y, chaosLevel) {
  // Crea un'onda di pulsazione - intensità basata sul caos
  pulseWave.push({
    x: x,
    y: y,
    radius: 10,
    maxRadius: 200 + chaosLevel * 200, // più caos = onde più grandi
    life: 80 + chaosLevel * 40, // più caos = onde più durature
    hue: hueValue,
    speed: 5 + chaosLevel * 5, // più caos = onde più veloci
    intensity: chaosLevel // intensità dell'onda
  });
}

function updatePulseWaves() {
  for (let i = pulseWave.length - 1; i >= 0; i--) {
    let wave = pulseWave[i];
    wave.radius += wave.speed;
    wave.life -= 2;
    
    if (wave.life <= 0 || wave.radius > wave.maxRadius) {
      pulseWave.splice(i, 1);
    }
  }
}

function drawPulseWaves() {
  pulseWave.forEach(wave => {
    noFill();
    let waveAlpha = map(wave.life, 0, 100, 0, 40) * wave.intensity;
    
    // Onda principale
    stroke(wave.hue, 80, 100, waveAlpha);
    strokeWeight(2 + wave.intensity * 2);
    ellipse(wave.x, wave.y, wave.radius * 2);
    
    // Onda interna - solo se abbastanza intensa
    if (wave.intensity > 0.3) {
      stroke(wave.hue, 60, 100, waveAlpha * 0.7);
      strokeWeight(1 + wave.intensity);
      ellipse(wave.x, wave.y, wave.radius * 1.8);
    }
  });
}

// Funzione debug opzionale per vedere i livelli di caos (rimuovi se non serve)
function drawChaosDebug() {
  let nearestLetter = null;
  let minDist = Infinity;
  
  // Trova la lettera più vicina al mouse
  letters.forEach(letter => {
    let d = dist(mouseX, mouseY, letter.x, letter.y);
    if (d < minDist) {
      minDist = d;
      nearestLetter = letter;
    }
  });
  
  if (nearestLetter) {
    fill(255);
    noStroke();
    textSize(16);
    textAlign(LEFT);
    text(`Distanza: ${floor(minDist)}px`, 20, 30);
    text(`Risonanza: ${floor(nearestLetter.resonance * 100)}%`, 20, 50);
    text(`Caos: ${floor(nearestLetter.chaosLevel * 100)}%`, 20, 70);
    textAlign(CENTER, CENTER);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}