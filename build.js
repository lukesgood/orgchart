const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'src/orgchart.js'), 'utf8');

// UMD build
const umd = `(function(root,factory){if(typeof define==='function'&&define.amd){define([],factory)}else if(typeof module==='object'&&module.exports){module.exports=factory()}else{root.OrgChart=factory()}}(typeof self!=='undefined'?self:this,function(){
${src}
return OrgChart;
}));`;

// ESM build
const esm = `${src}
export default OrgChart;
export { OrgChart };`;

// Minify (basic)
const minify = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}();,:])\s*/g, '$1')
  .replace(/;\s*}/g, '}')
  .trim();

fs.writeFileSync(path.join(__dirname, 'dist/orgchart.js'), umd);
fs.writeFileSync(path.join(__dirname, 'dist/orgchart.min.js'), minify(umd));
fs.writeFileSync(path.join(__dirname, 'dist/orgchart.esm.js'), esm);

console.log('Build complete!');
