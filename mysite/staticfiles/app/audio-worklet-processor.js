class FrameProcessor extends AudioWorkletProcessor {
  constructor(options){
    super();
    this.frameSize = (options.processorOptions && options.processorOptions.frameSize) || 2048;
    this._buffer = new Float32Array(this.frameSize);
    this._offset = 0;
  }
  process(inputs, outputs, parameters){
    const input = inputs[0];
    if(input && input[0]){
      const channel = input[0];
      // if channel length equals frameSize, post directly
      if(channel.length === this.frameSize){
        this.port.postMessage(channel.slice(0));
      } else {
        // accumulate into buffer and post when full
        let i=0;
        while(i<channel.length){
          const toCopy = Math.min(channel.length - i, this.frameSize - this._offset);
          this._buffer.set(channel.subarray(i, i+toCopy), this._offset);
          this._offset += toCopy;
          i += toCopy;
          if(this._offset === this.frameSize){
            this.port.postMessage(this._buffer.slice(0));
            this._offset = 0;
          }
        }
      }
    }
    return true;
  }
}
registerProcessor('frame-processor', FrameProcessor);
