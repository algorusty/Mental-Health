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
        if (fileName) {
            folderStructure[folderPath].push(fileName);
        }
    });

    let navbar = '<ul id="navbar" class="markdown-navbar">';
    Object.keys(folderStructure).forEach(folder => {
        navbar += `<li class="folder"><span class="folder-name">${folder}</span><ul class="dropdown">`;
        folderStructure[folder].forEach(file => {
            const displayName = file.replace('.md', '');
            const activeClass = displayName === 'README' ? ' active' : '';
            navbar += `<li class="nav-item${activeClass}"><a href="#${path.basename(file, '.md')}">${displayName}</a></li>`;
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
            <title>The Mind</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.4.0/github-markdown.min.css" integrity="sha512-30lMQ13MJJk66BfdlnvVnKmP05V7Qt1g6sHyYigDgV8i9M2ENAsXk1U4dVvKUYB6pqb2bVhoxhZsYK08hQpS+g==" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <style>
                body { font-family: Arial, sans-serif; display: flex; margin: auto; background-color: #0d1117;}
                #navbar { list-style-type: none; padding: 0; width: 200px; }
                #navbar .folder-name { cursor: pointer; display: block; padding: 8px; }
                #navbar .folder-name:before { content: '▸'; display: inline-block; margin-right: 5px; }
                #navbar .dropdown { display: none; list-style-type: none; padding: 0; margin: 0; }
                #navbar li.folder.open .dropdown { display: block; }
                #navbar li.folder.open .folder-name:before { content: '▾'; }
                #content { flex-grow: 1; padding: 20px; }
                .content { display: none; }
                .content.active { display: block; }
                // .markdown-body { max-width: 800px; margin: 0 auto; padding: 45px; }
                .markdown-navbar {
                    font-family: Arial, sans-serif;
                    background-color: #0d1117; // GitHub dark mode background color
                    border-right: 1px solid #21262d;
                    padding: 0.5em;
                    margin: 0;
                    width: 300px;
                    color: #c9d1d9; // GitHub dark mode text color
                }
            
                .markdown-navbar ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }
            
                .markdown-navbar li a {
                    color: #58a6ff; // GitHub dark mode link color
                    text-decoration: none;
                    padding: 0.5em;
                    display: block;
                }
            
                .markdown-navbar li a:hover {
                    text-decoration: underline;
                }
            
                .folder-name {
                    cursor: pointer;
                    font-weight: bold;
                }
            
                .folder-name:before {
                    content: '▸';
                    display: inline-block;
                    margin-right: 5px;
                }
            
                .folder.open .dropdown {
                    display: block;
                }
            
                .folder.open .folder-name:before {
                    content: '▾';
                }
            </style>
        </head>
        <body>
            ${navbar}
            <div id="content" class="markdown-body">${htmlContent}</div>
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
