"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const Marked = __importStar(require("marked"));
const handlebars_1 = __importDefault(require("handlebars"));
const rootFolder = path.resolve('./The Mind');
const outputDir = './public';
const scanDirectoryStructure = (dir, prefix = '') => __awaiter(void 0, void 0, void 0, function* () {
    const directoryContents = yield fs.readdir(dir, { withFileTypes: true });
    const files = yield Promise.all(directoryContents.map((dirent) => __awaiter(void 0, void 0, void 0, function* () {
        const fullPath = path.join(dir, dirent.name);
        return dirent.isDirectory() ?
            yield scanDirectoryStructure(fullPath, prefix + dirent.name + '/') :
            (path.extname(dirent.name) === '.md' ? [prefix + dirent.name] : []);
    })));
    return files.flat();
});
const generateHTMLContent = (filePaths) => __awaiter(void 0, void 0, void 0, function* () {
    const content = yield filePaths.reduce((htmlPromise, filePath) => __awaiter(void 0, void 0, void 0, function* () {
        const html = yield htmlPromise;
        const absolutePath = path.join(rootFolder, filePath);
        try {
            const markdown = yield fs.readFile(absolutePath, 'utf8');
            return html + `<div id="${path.basename(filePath, '.md')}" class="content">${Marked.parse(markdown)}</div>`;
        }
        catch (_a) {
            console.log(`File not found: ${absolutePath}`);
            return html;
        }
    }), Promise.resolve(''));
    return { content, files: filePaths };
});
const generateNavbar = (filePaths) => {
    const folderStructure = filePaths.reduce((structure, filePath) => {
        const parts = filePath.split('/');
        const fileName = parts.pop();
        const folderPath = parts.join('/');
        (structure[folderPath] = structure[folderPath] || []).push(fileName);
        return structure;
    }, {});
    return Object.entries(folderStructure).reduce((navbar, [folder, files]) => {
        const openClass = folder.includes('README') ? ' open' : '';
        const fileLinks = files.map(file => `<li class="nav-item${file.includes('README') ? ' active' : ''}"><a href="#${path.basename(file, '.md')}">${file.replace('.md', '')}</a></li>`).join('');
        return `${navbar}<li class="folder${openClass}"><span class="folder-name">${folder}</span><ul class="dropdown">${fileLinks}</ul></li>`;
    }, '<ul id="navbar" class="markdown-navbar">') + '</ul>';
};
const buildHTMLPage = (htmlContent, files) => {
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
    const compiledTemplate = handlebars_1.default.compile(template);
    return compiledTemplate({ navbar, htmlContent }).trim();
};
const executeBuildProcess = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const markdownFiles = yield scanDirectoryStructure(rootFolder);
        const { content } = yield generateHTMLContent(markdownFiles);
        const htmlPage = buildHTMLPage(content, markdownFiles);
        yield fs.mkdir(outputDir, { recursive: true });
        yield fs.writeFile(path.join(outputDir, 'index.html'), htmlPage);
        console.log('Website generated successfully!');
    }
    catch (error) {
        console.error('Error during the build process:', error);
    }
});
executeBuildProcess();
