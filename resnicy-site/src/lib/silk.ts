/**
 * «Шёлк»: живой фон на WebGL — складки чернильно-фиолетовой ткани с жемчужными бликами
 * и лёгкой радужностью (отсылка к перламутровой упаковке из её фото).
 * Рисуется в пониженном разрешении (фон мягкий, так быстрее), только пока виден.
 * Нет WebGL — остаётся CSS-градиент под холстом.
 */
const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMood;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float t=uTime*.32;
  vec2 m=(uMouse-.5)*vec2(uRes.x/uRes.y,1.);
  // складки «тянутся» к курсору
  uv+=.1*(m-uv)*exp(-2.2*length(uv-m));
  float a=-.62;
  uv=mat2(cos(a),-sin(a),sin(a),cos(a))*uv;
  vec2 tex=uv*1.12;
  tex.y+=.05*sin(7.*tex.x-t);
  float s=sin(5.*(tex.x+tex.y+cos(3.*tex.x+5.*tex.y)+.04*t)+sin(18.*(tex.x+tex.y-.07*t)));
  float pat=.5+.5*s;
  vec3 ink=vec3(.047,.031,.071);
  vec3 plum=vec3(.15,.09,.23);
  vec3 violet=vec3(.557,.357,1.);
  vec3 lilac=vec3(.851,.788,1.);
  vec3 col=mix(ink,plum,pat);
  col=mix(col,violet*.46,pow(pat,3.)*.42*uMood);
  col+=lilac*pow(pat,14.)*.24*uMood;
  col+=vec3(1.)*pow(pat,42.)*.22*uMood;
  col+=.045*uMood*pat*cos(6.2831*(pat*.6+vec3(0.,.33,.67))+t*.6);
  col*=smoothstep(1.6,.2,length(uv*vec2(.7,1.)));
  col-=hash(gl_FragCoord.xy+fract(t))*.022;
  gl_FragColor=vec4(col,1.);
}`;

export class Silk {
  private gl: WebGLRenderingContext;
  private uRes: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;
  private uMouse: WebGLUniformLocation | null;
  private uMood: WebGLUniformLocation | null;
  private scale = 0.5;
  mouse = [0.62, 0.55];
  /** WebGL считается процессором (нет видеоускорения): анимировать не стоит, хватит одного кадра. */
  software = false;
  private target = [0.62, 0.55];

  static create(canvas: HTMLCanvasElement, mood = 1) {
    try {
      const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", preserveDrawingBuffer: false });
      if (!gl) return null;
      return new Silk(canvas, gl, mood);
    } catch {
      return null;
    }
  }

  private constructor(
    private canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext,
    private mood: number,
  ) {
    this.gl = gl;
    try {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const name = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "");
      this.software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
    } catch {
      /* неизвестно — считаем, что ускорение есть */
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.uRes = gl.getUniformLocation(prog, "uRes");
    this.uTime = gl.getUniformLocation(prog, "uTime");
    this.uMouse = gl.getUniformLocation(prog, "uMouse");
    this.uMood = gl.getUniformLocation(prog, "uMood");
  }

  /** Доля разрешения: фон мягкий, поэтому хватает половины (на слабых — треть). */
  setScale(s: number) {
    this.scale = s;
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const k = Math.min(window.devicePixelRatio || 1, 2) * this.scale;
    this.canvas.width = Math.max(2, Math.round(r.width * k));
    this.canvas.height = Math.max(2, Math.round(r.height * k));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  pointer(x: number, y: number) {
    this.target = [x, 1 - y];
  }

  draw(time: number) {
    const gl = this.gl;
    this.mouse[0] += (this.target[0] - this.mouse[0]) * 0.04;
    this.mouse[1] += (this.target[1] - this.mouse[1]) * 0.04;
    gl.uniform2f(this.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uTime, time);
    gl.uniform2f(this.uMouse, this.mouse[0], this.mouse[1]);
    gl.uniform1f(this.uMood, this.mood);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
