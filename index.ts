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

const generateNavbar = (filePaths: string[]): string => {
    const folderStructure: { [key: string]: string[] } = {};

    filePaths.forEach(filePath => {
        const parts = filePath.split('/');
        const fileName = parts.pop();
        const folderPath = parts.join('/');

        if (!folderStructure[folderPath]) {
            folderStructure[folderPath] = [];
        }
        folderStructure[folderPath].push(fileName as string);
    });

    let navbar = '<ul id="navbar">';
    Object.keys(folderStructure).forEach(folder => {
        navbar += `<li class="folder"><span class="folder-name">${folder}</span><ul class="dropdown">`;
        folderStructure[folder].forEach(file => {
            navbar += `<li><a href="#${path.basename(file, '.md')}">${file}</a></li>`;
        });
        navbar += '</ul></li>';
    });
    navbar += '</ul>';

    return navbar;
};

const buildHTMLPage = (htmlContent: string, files: string[]): string => {
    const navbar = generateNavbar(files);
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Generated Website</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css">
    <style>
        body { font-family: Arial, sans-serif; display: flex; }
        #navbar { list-style-type: none; padding: 0; width: 200px; background-color: #f0f0f0; }
        #navbar .folder-name { cursor: pointer; display: block; padding: 8px; }
        #navbar .folder-name:before { content: '▸'; display: inline-block; margin-right: 5px; }
        #navbar .dropdown { display: none; list-style-type: none; padding: 0; margin: 0; }
        #navbar li.folder.open .dropdown { display: block; }
        #navbar li.folder.open .folder-name:before { content: '▾'; }
        #content { flex-grow: 1; padding: 20px; }
        .content { display: none; }
        .content.active { display: block; }
    </style>
</head>
<body>
    ${navbar}
    <div id="content">${htmlContent}</div>
    <script>
        document.querySelectorAll('#navbar .folder-name').forEach(element => {
            element.addEventListener('click', function() {
                this.parentElement.classList.toggle('open');
            });
        });
        document.getElementById('navbar').addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
                var active = document.querySelector('.content.active');
                if (active) active.classList.remove('active');
                var contentId = e.target.getAttribute('href').substring(1);
                if (contentId) {
                    var content = document.getElementById(contentId);
                    if (content) content.classList.add('active');
                }
                e.preventDefault();
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

// Ensure the output directory exists
const outputDir = './public';
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'index.html'), htmlPage);
console.log('Website generated successfully!');
