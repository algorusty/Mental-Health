import * as fs from 'fs';
import * as path from 'path';
import * as Marked from 'marked';

const scanDirectoryStructure = (dir: string, prefix: string = ''): string[] => {
    let fileList: string[] = [];
    const directoryContents = fs.readdirSync(dir, { withFileTypes: true });
    directoryContents.forEach(dirent => {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            fileList = fileList.concat(scanDirectoryStructure(fullPath, prefix + dirent.name + '/'));
        } else if (path.extname(dirent.name) === '.md') {
            fileList.push(prefix + dirent.name);
        }
    });
    console.log(fileList);
    return fileList;
};

const generateHTMLContent = (filePaths: string[]): { content: string, files: string[] } => {
    let content = '';
    filePaths.forEach(filePath => {
        const absolutePath = path.join(rootFolder, filePath);
        if (fs.existsSync(absolutePath)) {
            const markdown = fs.readFileSync(absolutePath, 'utf8');
            content += `<div id="${path.basename(filePath, '.md')}" class="content">${Marked.parse(markdown)}</div>`;
        } else {
            console.log(`File not found: ${absolutePath}`);
        }
    });
    return { content, files: filePaths };
};

const buildHTMLPage = (htmlContent: string, files: string[]): string => {
    const navbar = files.map(file => `<li><a href="#${path.basename(file, '.md')}">${path.basename(file)}</a></li>`).join('');
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Generated Website</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css">
    <style>
        body { font-family: Arial, sans-serif; display: flex; }
        #navbar { list-style-type: none; padding: 0; width: 200px; background-color: #f0f0f0; }
        #navbar li a { display: block; padding: 8px; text-decoration: none; }
        #content { flex-grow: 1; padding: 20px; }
        .content { display: none; }
        .content.active { display: block; }
    </style>
</head>
<body>
    <ul id="navbar">${navbar}</ul>
    <div id="content">${htmlContent}</div>
    <script>
        document.getElementById('navbar').addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                var active = document.querySelector('.content.active');
                if (active) active.classList.remove('active');
                var content = document.getElementById(e.target.getAttribute('href').substring(1));
                if (content) content.classList.add('active');
            }
        });
    </script>
</body>
</html>
    `.trim();
};

const rootFolder = path.resolve('./The Mind'); // Set your root folder
const markdownFiles = scanDirectoryStructure(rootFolder);
const { content, files } = generateHTMLContent(markdownFiles);
const htmlPage = buildHTMLPage(content, files);

fs.writeFileSync('./public/index.html', htmlPage);
console.log('Website generated successfully!');
