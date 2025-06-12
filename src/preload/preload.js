/**
 * Preload Script for Screen and Webcam Recorder
 * 
 * This script exposes secure APIs to the renderer process for:
 * 1. Getting available screen/window sources via desktopCapturer
 * 2. Saving recorded video buffers to disk with organized file structure
 * 3. Generating unique session IDs for recording organization
 * 
 * All APIs are exposed via contextBridge for security and work with the
 * main process to handle file operations through IPC.
 */

const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    },

    // Screen and webcam recorder APIs
    getScreenSources: async () => {
        try {
            const sources = await ipcRenderer.invoke('get-sources');
            return sources;
        } catch (error) {
            console.error('Error getting screen sources:', error);
            throw error;
        }
    },

    saveRecording: async (buffer, type, sessionId) => {
        try {
            // Convert buffer to Uint8Array if it's an ArrayBuffer
            const uint8Array = new Uint8Array(buffer);
            const result = await ipcRenderer.invoke('save-recording', {
                buffer: uint8Array,
                type: type, // 'screen' or 'webcam'
                sessionId: sessionId
            });
            return result;
        } catch (error) {
            console.error('Error saving recording:', error);
            throw error;
        }
    },

    // Generate a unique session ID for organizing recordings
    generateSessionId: () => {
        return ipcRenderer.invoke('generate-session-id');
    }
})

console.log('Preload script loaded successfully');
