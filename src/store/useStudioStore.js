import { create } from 'zustand';

export const useStudioStore = create((set) => ({
  activeTool: 'cut',
  file: null,
  secondaryFile: null,
  mergeFiles: [],
  apiKey: localStorage.getItem('studio_api_key') || '',
  
  isDragging: false,
  isDraggingSecondary: false,
  isDraggingMerge: false,
  
  params: {
    start_time: '00:00:00', end_time: '00:00:10', // cut
    speed: '1.5', // speed
    width: '1280', height: '720', // resize
    crop_width: '640', crop_height: '640', crop_x: '0', crop_y: '0', // crop
    replace_audio: false, // add-audio
    first_frame: false, last_frame: false, timestamp: '' // extract-frames
  },

  jobId: null,
  jobStatus: null,
  loading: false,
  uploadProgress: 0,
  error: '',

  // Standard setters (with optional functional updater support)
  setActiveTool: (activeTool) => set(typeof activeTool === 'function' ? state => ({ activeTool: activeTool(state.activeTool) }) : { activeTool }),
  setFile: (file) => set(typeof file === 'function' ? state => ({ file: file(state.file) }) : { file }),
  setSecondaryFile: (secondaryFile) => set(typeof secondaryFile === 'function' ? state => ({ secondaryFile: secondaryFile(state.secondaryFile) }) : { secondaryFile }),
  setMergeFiles: (mergeFiles) => set(typeof mergeFiles === 'function' ? state => ({ mergeFiles: mergeFiles(state.mergeFiles) }) : { mergeFiles }),
  
  setApiKey: (apiKey) => {
    const newVal = typeof apiKey === 'function' ? apiKey(localStorage.getItem('studio_api_key') || '') : apiKey;
    localStorage.setItem('studio_api_key', newVal);
    set({ apiKey: newVal });
  },
  
  setIsDragging: (isDragging) => set(typeof isDragging === 'function' ? state => ({ isDragging: isDragging(state.isDragging) }) : { isDragging }),
  setIsDraggingSecondary: (isDraggingSecondary) => set(typeof isDraggingSecondary === 'function' ? state => ({ isDraggingSecondary: isDraggingSecondary(state.isDraggingSecondary) }) : { isDraggingSecondary }),
  setIsDraggingMerge: (isDraggingMerge) => set(typeof isDraggingMerge === 'function' ? state => ({ isDraggingMerge: isDraggingMerge(state.isDraggingMerge) }) : { isDraggingMerge }),
  
  setParams: (params) => set(typeof params === 'function' ? state => ({ params: params(state.params) }) : { params }),
  
  setJobId: (jobId) => set(typeof jobId === 'function' ? state => ({ jobId: jobId(state.jobId) }) : { jobId }),
  setJobStatus: (jobStatus) => set(typeof jobStatus === 'function' ? state => ({ jobStatus: jobStatus(state.jobStatus) }) : { jobStatus }),
  setLoading: (loading) => set(typeof loading === 'function' ? state => ({ loading: loading(state.loading) }) : { loading }),
  setUploadProgress: (uploadProgress) => set(typeof uploadProgress === 'function' ? state => ({ uploadProgress: uploadProgress(state.uploadProgress) }) : { uploadProgress }),
  setError: (error) => set(typeof error === 'function' ? state => ({ error: error(state.error) }) : { error }),
}));
