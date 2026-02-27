interface OrgChartNode {
  id: number | string;
  name: string;
  title?: string;
  department?: string;
  image?: string;
  parentId?: number | string | null;
}

interface OrgChartOptions {
  data: OrgChartNode[];
  theme?: 'corporate' | 'startup' | 'modern' | 'minimal' | 'vibrant';
  layout?: 'tree' | 'radial';
  direction?: 'vertical' | 'horizontal';
  connectorStyle?: 'curved' | 'straight';
  nodeWidth?: number;
  nodeHeight?: number;
  levelGap?: number;
  siblingGap?: number;
  onNodeClick?: (node: OrgChartNode) => void;
}

declare class OrgChart {
  constructor(container: string | HTMLElement, options?: OrgChartOptions);
  setTheme(theme: 'corporate' | 'startup' | 'modern' | 'minimal' | 'vibrant'): void;
  setLayout(layout: 'tree' | 'radial'): void;
  setDirection(direction: 'vertical' | 'horizontal'): void;
  setConnectorStyle(style: 'curved' | 'straight'): void;
  updateData(data: OrgChartNode[]): void;
  exportPNG(filename?: string): void;
  render(): void;
}

export = OrgChart;
export as namespace OrgChart;
