const noteElement = document.getElementById("note");
const frequencyElement = document.getElementById("frequency");
const detuneElement = document.getElementById("detune");
const startButton = document.getElementById("start-btn");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// List of musical notes
const noteFrequencies = [
    { note: "C", freq: 261.63 },
    { note: "C#", freq: 277.18 },
    { note: "D", freq: 293.66 },
    { note: "D#", freq: 311.13 },
    { note: "E", freq: 329.63 },
    { note: "F", freq: 349.23 },
    { note: "F#", freq: 369.99 },
    { note: "G", freq: 392.00 },
    { note: "G#", freq: 415.30 },
    { note: "A", freq: 440.00 },
    { note: "A#", freq: 466.16 },
    { note: "B", freq: 493.88 }
];

let audioContext;
let analyser;
let microphone;
let bufferLength;
let dataArray;

// Start the tuner
async function startTuning() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        bufferLength = analyser.fftSize;
        dataArray = new Float32Array(bufferLength);
        microphone.connect(analyser);

        startButton.style.display = "none";
        updatePitch();
    } catch (error) {
        alert("Microphone access denied. Please allow microphone access.");
    }
}

// Find the closest note
function getClosestNote(frequency) {
    return noteFrequencies.reduce((closest, note) => 
        Math.abs(note.freq - frequency) < Math.abs(closest.freq - frequency) ? note : closest
    );
}

// Pitch detection loop
function updatePitch() {
    requestAnimationFrame(updatePitch);
    
    analyser.getFloatTimeDomainData(dataArray);
    const frequency = autoCorrelate(dataArray, audioContext.sampleRate);

    if (frequency > 0) {
        const closestNote = getClosestNote(frequency);
        const detune = Math.round(1200 * Math.log2(frequency / closestNote.freq));

        noteElement.innerText = closestNote.note;
        frequencyElement.innerText = `Frequency: ${frequency.toFixed(2)} Hz`;
        detuneElement.innerText = `Detune: ${detune} cents`;

        drawTuner(detune);
    }
}

// Autocorrelation algorithm for pitch detection
function autoCorrelate(buffer, sampleRate) {
    let SIZE = buffer.length;
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    
    for (let i = 0; i < SIZE; i++) {
        rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let lastCorrelation = 1;
    for (let offset = 0; offset < SIZE / 2; offset++) {
        let correlation = 0;
        for (let i = 0; i < SIZE / 2; i++) {
            correlation += buffer[i] * buffer[i + offset];
        }
        correlation /= SIZE / 2;
        if (correlation > 0.9 && correlation > lastCorrelation) {
            bestOffset = offset;
            bestCorrelation = correlation;
        } else if (bestOffset > -1) {
            return sampleRate / bestOffset;
        }
        lastCorrelation = correlation;
    }
    return -1;
}

// Draw tuner display
function drawTuner(detune) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff5733";
    ctx.fillRect(canvas.width / 2 + detune * 2, 40, 5, 20);
}

startButton.addEventListener("click", startTuning);
