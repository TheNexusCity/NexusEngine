export default `void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

	outputColor = LinearTosRGB(max(inputColor, 0.0));

}`
