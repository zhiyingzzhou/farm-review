import potrace from 'potrace';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, 'logo1.png');
const outputFile = path.join(__dirname, 'logo1.svg');

// 使用 posterize 来保留多层次细节（电路板图案等）
const params = {
    // 使用亮绿色填充（与原图一致）
    fillStrategy: potrace.Potrace.FILL_MEAN,
    // 颜色范围：从透明背景到绿色内容
    rangeDistribution: potrace.Potrace.RANGES_AUTO,
    // 层次数量，越多细节越好
    steps: 4,
    // 阈值设置
    threshold: 200,
    // 背景透明
    background: 'transparent',
    // 去除太小的斑点
    turdSize: 2,
    // 高精度曲线
    optTolerance: 0.1,
    alphaMax: 1,
    optCurve: true,
};

potrace.posterize(inputFile, params, function (err, svg) {
    if (err) {
        console.error('Error tracing image:', err);
        process.exit(1);
    }

    fs.writeFileSync(outputFile, svg);
    console.log('SVG saved to:', outputFile);
});
