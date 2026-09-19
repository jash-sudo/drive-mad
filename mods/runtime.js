/* Hooks load before the Fancade runtime. No engine memory offsets are used. */
(() => {
  'use strict';
  const mod = window.DriveMod = { speed: 1, paused: false, color: null, skinPrograms: 0 };
  let previous = performance.now(), virtual = previous;
  const epoch = Date.now() - previous;
  mod.dateNow = () => epoch + mod.now();
  mod.now = () => {
    const now = performance.now();
    virtual += (now - previous) * (mod.paused ? 0 : mod.speed);
    previous = now;
    return virtual;
  };
  mod.setSpeed = value => { mod.now(); mod.speed = value; };
  mod.setPaused = value => { mod.now(); mod.paused = value; };

  // Recolor the original yellow material while retaining its lighting.
  // A material palette is shared: matching yellow scenery is recolored too.
  for (const Type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Type) continue;
    const proto = Type.prototype;
    const source = proto.shaderSource, compile = proto.compileShader;
    const originals = new WeakMap(), programs = new WeakMap();
    proto.shaderSource = function(shader, text) {
      if (this.getShaderParameter(shader, this.SHADER_TYPE) === this.FRAGMENT_SHADER && /void\s+main\s*\(/.test(text)) {
        const output = text.includes('gl_FragColor') ? 'gl_FragColor' : (text.match(/out\s+(?:(?:lowp|mediump|highp)\s+)?vec4\s+(\w+)\s*;/) || [])[1];
        if (output) {
          originals.set(shader, text);
          text = text.replace(/void\s+main\s*\(/, 'void driveOriginalMain(') + `
uniform lowp vec3 driveSkinColor;
uniform lowp float driveSkinEnabled;
void main() {
  driveOriginalMain();
  lowp vec3 c = ${output}.rgb;
  lowp float yellow = step(0.34, c.r) * step(c.r * 0.65, c.g) * step(c.g, c.r * 1.12) * step(c.b, c.g * 0.48);
  ${output}.rgb = mix(c, driveSkinColor * max(c.r, c.g), yellow * driveSkinEnabled);
}`;
        }
      }
      return source.call(this, shader, text);
    };
    proto.compileShader = function(shader) {
      compile.call(this, shader);
      if (!this.getShaderParameter(shader, this.COMPILE_STATUS) && originals.has(shader)) {
        console.warn('Drive Mod: skin shader unsupported; using original shader.');
        source.call(this, shader, originals.get(shader));
        compile.call(this, shader);
      }
    };
    const use = proto.useProgram;
    const activePrograms = new WeakMap();
    proto.useProgram = function(program) {
      activePrograms.set(this, program);
      return use.call(this, program);
    };
    for (const method of ['drawArrays', 'drawElements']) {
      const draw = proto[method];
      proto[method] = function(...args) {
        const active = activePrograms.get(this);
        if (active) {
          let uniforms = programs.get(active);
          if (!uniforms) {
            uniforms = { color: this.getUniformLocation(active, 'driveSkinColor'), enabled: this.getUniformLocation(active, 'driveSkinEnabled') };
            programs.set(active, uniforms);
            if (uniforms.enabled !== null) mod.skinPrograms++;
          }
          if (uniforms.enabled !== null) {
            this.uniform1f(uniforms.enabled, mod.color ? 1 : 0);
            this.uniform3fv(uniforms.color, mod.color || [1,1,0]);
          }
        }
        return draw.apply(this, args);
      };
    }
  }
})();
