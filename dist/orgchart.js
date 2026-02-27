(function(root,factory){if(typeof define==='function'&&define.amd){define([],factory)}else if(typeof module==='object'&&module.exports){module.exports=factory()}else{root.OrgChart=factory()}}(typeof self!=='undefined'?self:this,function(){
class OrgChart {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.data = options.data || [];
    this.nodeWidth = options.nodeWidth || 200;
    this.nodeHeight = options.nodeHeight || 100;
    this.levelGap = options.levelGap || 80;
    this.siblingGap = options.siblingGap || 20;
    this.layout = options.layout || 'tree';
    this.theme = options.theme || 'corporate';
    this.direction = options.direction || 'vertical';
    this.connectorStyle = options.connectorStyle || 'curved';
    this.onNodeClick = options.onNodeClick || null;
    this.themes = this.getThemes();
    this.render();
  }

  getThemes() {
    return {
      corporate: {
        primary: '#1a365d',
        secondary: '#2d3748',
        accent: '#3182ce',
        background: '#ffffff',
        text: '#1a202c',
        textLight: '#718096',
        border: '#e2e8f0',
        gradient: ['#1a365d', '#2c5282'],
        nodeRadius: '12px',
        shadow: '0 4px 20px rgba(0,0,0,0.08)'
      },
      startup: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        border: '#e5e7eb',
        gradient: ['#6366f1', '#8b5cf6'],
        nodeRadius: '16px',
        shadow: '0 8px 30px rgba(99,102,241,0.15)'
      },
      modern: {
        primary: '#0f172a',
        secondary: '#334155',
        accent: '#06b6d4',
        background: '#ffffff',
        text: '#0f172a',
        textLight: '#64748b',
        border: '#e2e8f0',
        gradient: ['#0f172a', '#1e293b'],
        nodeRadius: '8px',
        shadow: '0 4px 16px rgba(0,0,0,0.06)'
      },
      minimal: {
        primary: '#18181b',
        secondary: '#3f3f46',
        accent: '#a1a1aa',
        background: '#fafafa',
        text: '#18181b',
        textLight: '#71717a',
        border: '#e4e4e7',
        gradient: ['#18181b', '#27272a'],
        nodeRadius: '4px',
        shadow: '0 1px 3px rgba(0,0,0,0.1)'
      },
      vibrant: {
        primary: '#7c3aed',
        secondary: '#db2777',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        border: '#f3e8ff',
        gradient: ['#7c3aed', '#db2777'],
        nodeRadius: '20px',
        shadow: '0 10px 40px rgba(124,58,237,0.2)'
      }
    };
  }

  render() {
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    this.container.style.background = this.themes[this.theme].background;
    
    const root = this.data.find(n => !n.parentId);
    if (!root) return;

    const tree = this.buildTree(root.id);
    let positions = this.layout === 'radial' 
      ? this.calculateRadialPositions(tree)
      : this.calculatePositions(tree);
    
    positions = this.fitToContainer(positions);
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0';
    
    if (this.layout === 'radial') this.drawRadialBackground(svg, positions);
    this.drawConnections(svg, positions);
    this.container.appendChild(svg);
    this.drawNodes(positions);
  }

  buildTree(nodeId) {
    const node = this.data.find(n => n.id === nodeId);
    const children = this.data.filter(n => n.parentId === nodeId).map(c => this.buildTree(c.id));
    return { ...node, children };
  }

  calculatePositions(node, level = 0) {
    const positions = this.layoutTree(node, level);
    const minX = Math.min(...positions.map(p => p.x));
    return positions.map(p => ({ ...p, x: p.x - minX + 20 }));
  }

  layoutTree(node, level, offset = 0) {
    const positions = [];
    let x = offset;
    const gap = this.direction === 'horizontal' ? this.levelGap : this.nodeHeight + this.levelGap;

    if (node.children.length === 0) {
      const pos = this.direction === 'horizontal'
        ? { x: level * (this.nodeWidth + this.levelGap), y: offset }
        : { x: offset, y: level * gap };
      positions.push({ ...node, ...pos, level });
      return positions;
    }

    node.children.forEach(child => {
      const childPos = this.layoutTree(child, level + 1, x);
      positions.push(...childPos);
      x += this.getSubtreeWidth(child);
    });

    const firstChild = positions.find(p => p.id === node.children[0].id);
    const lastChild = positions.find(p => p.id === node.children[node.children.length - 1].id);
    
    const pos = this.direction === 'horizontal'
      ? { x: level * (this.nodeWidth + this.levelGap), y: (firstChild.y + lastChild.y) / 2 }
      : { x: (firstChild.x + lastChild.x) / 2, y: level * gap };
    
    positions.push({ ...node, ...pos, level });
    return positions;
  }

  getSubtreeWidth(node) {
    if (node.children.length === 0) return this.nodeWidth + this.siblingGap;
    return node.children.reduce((sum, child) => sum + this.getSubtreeWidth(child), 0);
  }

  calculateRadialPositions(tree) {
    const positions = [];
    const centerX = this.container.offsetWidth / 2;
    const centerY = this.container.offsetHeight / 2;
    
    const getNodesAtLevel = (node, level, targetLevel) => {
      if (level === targetLevel) return [node];
      return node.children.flatMap(child => getNodesAtLevel(child, level + 1, targetLevel));
    };
    
    const maxLevel = this.getMaxLevel(tree, 0);
    positions.push({ ...tree, x: centerX - this.nodeWidth / 2, y: centerY - this.nodeHeight / 2, level: 0, isCenter: true });
    
    for (let level = 1; level <= maxLevel; level++) {
      const nodesAtLevel = getNodesAtLevel(tree, 0, level);
      const radius = level * (this.levelGap + this.nodeHeight);
      const angleStep = (Math.PI * 2) / nodesAtLevel.length;
      
      nodesAtLevel.forEach((node, i) => {
        const angle = i * angleStep - Math.PI / 2;
        positions.push({
          ...node,
          x: centerX + radius * Math.cos(angle) - this.nodeWidth / 2,
          y: centerY + radius * Math.sin(angle) - this.nodeHeight / 2,
          level, angle, radius
        });
      });
    }
    
    this.maxRadialLevel = maxLevel;
    this.radialCenter = { x: centerX, y: centerY };
    return positions;
  }

  getMaxLevel(node, level) {
    if (node.children.length === 0) return level;
    return Math.max(...node.children.map(child => this.getMaxLevel(child, level + 1)));
  }

  fitToContainer(positions) {
    const containerW = this.container.offsetWidth;
    const containerH = this.container.offsetHeight;
    const padding = 40;
    
    const nodeH = this.layout === 'radial' ? this.nodeWidth : this.nodeHeight;
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x + this.nodeWidth));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y + nodeH));
    
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    
    const scaleX = (containerW - padding * 2) / contentW;
    const scaleY = (containerH - padding * 2) / contentH;
    this.scale = Math.min(scaleX, scaleY, 1);
    
    const scaledW = contentW * this.scale;
    const scaledH = contentH * this.scale;
    const offsetX = (containerW - scaledW) / 2 - minX * this.scale;
    const offsetY = (containerH - scaledH) / 2 - minY * this.scale;
    
    if (this.layout === 'radial' && this.radialCenter) {
      this.radialCenter.x = this.radialCenter.x * this.scale + offsetX;
      this.radialCenter.y = this.radialCenter.y * this.scale + offsetY;
    }
    
    return positions.map(p => ({ ...p, x: p.x * this.scale + offsetX, y: p.y * this.scale + offsetY }));
  }

  drawRadialBackground(svg, positions) {
    const t = this.themes[this.theme];
    if (!this.maxRadialLevel) return;
    
    for (let level = this.maxRadialLevel; level >= 1; level--) {
      const radius = level * (this.levelGap + this.nodeHeight) * this.scale;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', this.radialCenter.x);
      circle.setAttribute('cy', this.radialCenter.y);
      circle.setAttribute('r', radius);
      circle.setAttribute('stroke', t.border);
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('stroke-dasharray', '4,4');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('opacity', '0.5');
      svg.appendChild(circle);
    }
  }

  drawConnections(svg, positions) {
    const t = this.themes[this.theme];
    const s = this.scale || 1;
    const nw = this.nodeWidth * s;
    const nh = this.nodeHeight * s;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'lineGradient');
    gradient.innerHTML = `<stop offset="0%" stop-color="${t.gradient[0]}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${t.gradient[1]}" stop-opacity="0.3"/>`;
    defs.appendChild(gradient);
    svg.appendChild(defs);

    positions.forEach(node => {
      if (!node.parentId) return;
      const parent = positions.find(p => p.id === node.parentId);
      if (!parent) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d;

      if (this.layout === 'radial') {
        const x1 = parent.x + nw / 2, y1 = parent.y + nw / 2;
        const x2 = node.x + nw / 2, y2 = node.y + nw / 2;
        d = `M ${x1} ${y1} L ${x2} ${y2}`;
      } else if (this.direction === 'horizontal') {
        const x1 = parent.x + nw, y1 = parent.y + nh / 2;
        const x2 = node.x, y2 = node.y + nh / 2;
        const midX = (x1 + x2) / 2;
        d = this.connectorStyle === 'curved'
          ? `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
          : `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
      } else {
        const x1 = parent.x + nw / 2, y1 = parent.y + nh;
        const x2 = node.x + nw / 2, y2 = node.y;
        const midY = (y1 + y2) / 2;
        d = this.connectorStyle === 'curved'
          ? `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
          : `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      }

      line.setAttribute('d', d);
      line.setAttribute('stroke', this.layout === 'radial' ? t.border : 'url(#lineGradient)');
      line.setAttribute('stroke-width', this.layout === 'radial' ? '1' : '2');
      line.setAttribute('fill', 'none');
      svg.appendChild(line);
    });
  }

  drawNodes(positions) {
    const t = this.themes[this.theme];
    const s = this.scale || 1;
    const nw = this.nodeWidth * s;
    const nh = this.nodeHeight * s;

    positions.forEach(node => {
      const div = document.createElement('div');
      div.className = 'org-node';
      div.style.cssText = `position:absolute;left:${node.x}px;top:${node.y}px;width:${nw}px;height:${nh}px;
        box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;
        z-index:1;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;`;

      if (this.layout === 'radial') {
        div.style.width = div.style.height = nw + 'px';
        div.style.top = (node.y + nh / 2 - nw / 2) + 'px';
        div.style.borderRadius = '50%';
        
        if (node.isCenter) {
          div.style.background = `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`;
          div.style.color = '#fff';
          div.style.boxShadow = t.shadow;
        } else {
          div.style.background = t.background;
          div.style.border = `${2 * s}px solid ${t.accent}`;
          div.style.boxShadow = t.shadow;
        }
      } else {
        div.style.borderRadius = t.nodeRadius;
        div.style.background = t.background;
        div.style.boxShadow = t.shadow;
        
        if (node.level === 0) {
          div.style.background = `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`;
          div.style.color = '#fff';
        } else {
          div.style.border = `1px solid ${t.border}`;
        }
      }

      div.onmouseenter = () => { div.style.transform = 'scale(1.03)'; div.style.boxShadow = t.shadow.replace(')', ', 0 8px 25px rgba(0,0,0,0.12))'); };
      div.onmouseleave = () => { div.style.transform = 'scale(1)'; div.style.boxShadow = t.shadow; };
      if (this.onNodeClick) div.onclick = () => this.onNodeClick(node);

      const isLight = node.level === 0 || (this.layout === 'radial' && node.isCenter);
      const content = this.createNodeContent(node, s, isLight, t);
      div.appendChild(content);
      this.container.appendChild(div);
    });
  }

  createNodeContent(node, s, isLight, t) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `padding:${12 * s}px;text-align:center;width:100%;box-sizing:border-box;`;

    if (node.image) {
      const img = document.createElement('img');
      img.src = node.image;
      img.style.cssText = `width:${40 * s}px;height:${40 * s}px;border-radius:50%;object-fit:cover;
        margin-bottom:${6 * s}px;border:2px solid ${isLight ? 'rgba(255,255,255,0.3)' : t.border};`;
      wrapper.appendChild(img);
    }

    const name = document.createElement('div');
    name.textContent = node.name;
    name.style.cssText = `font-weight:600;font-size:${(this.layout === 'radial' ? 11 : 14) * s}px;
      margin-bottom:${2 * s}px;color:${isLight ? '#fff' : t.text};line-height:1.3;`;
    wrapper.appendChild(name);

    if (node.title) {
      const title = document.createElement('div');
      title.textContent = node.title;
      title.style.cssText = `font-size:${(this.layout === 'radial' ? 9 : 12) * s}px;
        color:${isLight ? 'rgba(255,255,255,0.85)' : t.textLight};line-height:1.3;`;
      wrapper.appendChild(title);
    }

    if (node.department && this.layout !== 'radial') {
      const dept = document.createElement('div');
      dept.textContent = node.department;
      dept.style.cssText = `font-size:${10 * s}px;color:${t.accent};margin-top:${4 * s}px;
        font-weight:500;`;
      wrapper.appendChild(dept);
    }

    return wrapper;
  }

  setTheme(theme) {
    if (this.themes[theme]) {
      this.theme = theme;
      this.render();
    }
  }

  setLayout(layout) {
    this.layout = layout;
    this.render();
  }

  setDirection(direction) {
    this.direction = direction;
    this.render();
  }

  setConnectorStyle(style) {
    this.connectorStyle = style;
    this.render();
  }

  updateData(data) {
    this.data = data;
    this.render();
  }

  exportPNG(filename = 'orgchart.png') {
    const rect = this.container.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = this.themes[this.theme].background;
    ctx.fillRect(0, 0, rect.width, rect.height);

    const svg = this.container.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        URL.revokeObjectURL(url);
        this.drawNodesToCanvas(ctx);
        this.downloadCanvas(canvas, filename);
      };
      img.src = url;
    } else {
      this.drawNodesToCanvas(ctx);
      this.downloadCanvas(canvas, filename);
    }
  }

  drawNodesToCanvas(ctx) {
    const t = this.themes[this.theme];
    const nodes = this.container.querySelectorAll('.org-node');
    
    nodes.forEach(node => {
      const x = parseFloat(node.style.left);
      const y = parseFloat(node.style.top);
      const w = parseFloat(node.style.width);
      const h = parseFloat(node.style.height);
      const isCircle = node.style.borderRadius === '50%';
      const isGradient = node.style.background.includes('gradient');

      ctx.save();
      if (isCircle) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
      } else {
        const r = parseInt(t.nodeRadius) || 8;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
      }

      if (isGradient) {
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, t.gradient[0]);
        grad.addColorStop(1, t.gradient[1]);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = t.background;
      }
      ctx.fill();

      if (!isGradient) {
        ctx.strokeStyle = isCircle ? t.accent : t.border;
        ctx.lineWidth = isCircle ? 2 : 1;
        ctx.stroke();
      }
      ctx.restore();

      const texts = node.querySelectorAll('div > div');
      ctx.textAlign = 'center';
      let textY = y + h / 2 - (texts.length - 1) * 8;

      texts.forEach((text, i) => {
        const fontSize = parseFloat(text.style.fontSize) || 12;
        const fontWeight = text.style.fontWeight === '600' ? 'bold' : 'normal';
        ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillStyle = text.style.color || t.text;
        ctx.fillText(text.textContent, x + w / 2, textY + i * (fontSize + 4));
      });
    });
  }

  downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrgChart;
}

return OrgChart;
}));