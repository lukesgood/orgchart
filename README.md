# OrgChart Pro

Professional organizational chart library for business presentations and proposals.

[![npm version](https://badge.fury.io/js/orgchart-pro.svg)](https://www.npmjs.com/package/orgchart-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎨 **5 Professional Themes** - Corporate, Startup, Modern, Minimal, Vibrant
- 📐 **Multiple Layouts** - Tree (vertical/horizontal) and Radial
- 🔗 **Connector Styles** - Curved and straight lines
- 📱 **Auto-fit** - Automatically scales to container size
- 📸 **PNG Export** - High-resolution image export
- 🖱️ **Interactive** - Hover effects and click events
- 🚀 **Zero Dependencies** - Pure JavaScript, no external libraries

## Installation

### NPM
```bash
npm install orgchart-pro
```

### CDN
```html
<script src="https://unpkg.com/orgchart-pro/dist/orgchart.min.js"></script>
```

## Quick Start

```html
<div id="chart" style="width: 100%; height: 500px;"></div>
<script src="orgchart.min.js"></script>
<script>
const chart = new OrgChart('#chart', {
  data: [
    { id: 1, name: 'CEO', title: '대표이사' },
    { id: 2, name: 'CTO', title: '기술이사', parentId: 1 },
    { id: 3, name: 'CFO', title: '재무이사', parentId: 1 }
  ],
  theme: 'corporate'
});
</script>
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | Array | `[]` | Organization data (required) |
| `theme` | String | `'corporate'` | Theme: `corporate`, `startup`, `modern`, `minimal`, `vibrant` |
| `layout` | String | `'tree'` | Layout: `tree`, `radial` |
| `direction` | String | `'vertical'` | Direction: `vertical`, `horizontal` |
| `connectorStyle` | String | `'curved'` | Connector: `curved`, `straight` |
| `nodeWidth` | Number | `200` | Node width in pixels |
| `nodeHeight` | Number | `100` | Node height in pixels |
| `levelGap` | Number | `80` | Gap between levels |
| `siblingGap` | Number | `20` | Gap between siblings |
| `onNodeClick` | Function | `null` | Click event handler |

## Data Format

```javascript
{
  id: 1,              // Unique identifier (required)
  name: 'John Doe',   // Display name (required)
  title: 'CEO',       // Job title
  department: 'Exec', // Department name
  image: 'url',       // Profile image URL
  parentId: null      // Parent node ID (null for root)
}
```

## API Methods

```javascript
// Change theme
chart.setTheme('startup');

// Change layout
chart.setLayout('radial');

// Change direction (tree layout only)
chart.setDirection('horizontal');

// Change connector style
chart.setConnectorStyle('straight');

// Update data
chart.updateData(newData);

// Export as PNG
chart.exportPNG('my-orgchart.png');
```

## Themes

| Theme | Best For |
|-------|----------|
| `corporate` | Traditional companies, formal presentations |
| `startup` | Tech startups, innovative companies |
| `modern` | Contemporary businesses |
| `minimal` | Clean, simple presentations |
| `vibrant` | Creative agencies, bold presentations |

## Examples

### Corporate Style
```javascript
new OrgChart('#chart', {
  data: orgData,
  theme: 'corporate',
  layout: 'tree',
  direction: 'vertical'
});
```

### Startup Radial
```javascript
new OrgChart('#chart', {
  data: orgData,
  theme: 'startup',
  layout: 'radial'
});
```

### Horizontal Layout
```javascript
new OrgChart('#chart', {
  data: orgData,
  theme: 'modern',
  layout: 'tree',
  direction: 'horizontal'
});
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT © Luke

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.
