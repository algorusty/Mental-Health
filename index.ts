import * as fs from 'fs/promises';
import * as path from 'path';
import * as Marked from 'marked';
import Handlebars from 'handlebars';

interface FileStructure {
    [folder: string]: string[];
}

const rootFolder = path.resolve('./The Mind');
const outputDir = './public';

const scanDirectoryStructure = async (dir: string, prefix: string = ''): Promise<string[]> => {
    const directoryContents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(directoryContents.map(async dirent => {
        const fullPath = path.join(dir, dirent.name);
        return dirent.isDirectory() ?
            await scanDirectoryStructure(fullPath, prefix + dirent.name + '/') :
            (path.extname(dirent.name) === '.md' ? [prefix + dirent.name] : []);
    }));
    return files.flat();
};

const generateHTMLContent = async (filePaths: string[]): Promise<{ content: string, files: string[] }> => {
    const content = await filePaths.reduce(async (htmlPromise, filePath) => {
        const html = await htmlPromise;
        const absolutePath = path.join(rootFolder, filePath);
        try {
            const markdown = await fs.readFile(absolutePath, 'utf8');
            return html + `<div id="${path.basename(filePath, '.md')}" class="content">${Marked.parse(markdown)}</div>`;
        } catch {
            console.log(`File not found: ${absolutePath}`);
            return html;
        }
    }, Promise.resolve(''));

    return { content, files: filePaths };
};

const generateNavbar = (filePaths: string[]): string => {
    const folderStructure = filePaths.reduce<FileStructure>((structure, filePath) => {
        const parts = filePath.split('/');
        const fileName = parts.pop()!;
        const folderPath = parts.join('/');

        (structure[folderPath] = structure[folderPath] || []).push(fileName);
        return structure;
    }, {});

    return Object.entries(folderStructure).reduce((navbar, [folder, files]) => {
        const openClass = folder.includes('README') ? ' open' : '';
        const fileLinks = files.map(file => 
            `<li class="nav-item${file.includes('README') ? ' active' : ''}"><a href="#${path.basename(file, '.md')}">${file.replace('.md', '')}</a></li>`
        ).join('');
        return `${navbar}<li class="folder${openClass}"><span class="folder-name">${folder}</span><ul class="dropdown">${fileLinks}</ul></li>`;
    }, '<ul id="navbar" class="markdown-navbar">') + '</ul>';
};

const buildHTMLPage = (htmlContent: string, files: string[]): string => {
    const navbar = generateNavbar(files);
    const template = `
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
            {{{navbar}}}
            <div id="content" class="markdown-body">{{{htmlContent}}}</div>
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
                window.onload = function() {
                    var readmeLink = document.querySelector('a[href="#README"]');
                    if (readmeLink) readmeLink.click();
                };
                </script>
                </body>
                </html>
            `;
        
            const compiledTemplate = Handlebars.compile(template);
            return compiledTemplate({ navbar, htmlContent }).trim();
        };
        
        const executeBuildProcess = async () => {
            try {
                const markdownFiles = await scanDirectoryStructure(rootFolder);
                const { content } = await generateHTMLContent(markdownFiles);
                const htmlPage = buildHTMLPage(content, markdownFiles);
        
                await fs.mkdir(outputDir, { recursive: true });
                await fs.writeFile(path.join(outputDir, 'index.html'), htmlPage);
                console.log('Website generated successfully!');
            } catch (error) {
                console.error('Error during the build process:', error);
            }
        };
        
        executeBuildProcess();