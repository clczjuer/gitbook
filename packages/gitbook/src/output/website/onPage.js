const path = require('path');
const omit = require('omit-keys');

const Templating = require('../../templating');
const Plugins = require('../../plugins');
const JSONUtils = require('../../json');
const LocationUtils = require('../../utils/location');
const Modifiers = require('../modifiers');
const writeFile = require('../helper/writeFile');
const fileToOutput = require('../helper/fileToOutput');
const getModifiers = require('../getModifiers');
const createTemplateEngine = require('./createTemplateEngine');
const render = require('./render');

/**
 * Write a page as a json file
 *
 * @param {Output} output
 * @param {Page} page
 */
function onPage(output, page) {
    const options   = output.getOptions();
    const prefix    = options.get('prefix');

    const file      = page.getFile();

    const book      = output.getBook();
    const plugins   = output.getPlugins();
    const state     = output.getState();
    const resources = state.getResources();

    const engine = createTemplateEngine(output, page.getPath());

    // Output file path
    const filePath = fileToOutput(output, file.getPath());

    // Calcul relative path to the root
    const outputDirName = path.dirname(filePath);
    const basePath = LocationUtils.normalize(path.relative(outputDirName, './'));

    return Modifiers.modifyHTML(page, getModifiers(output, page))
    .then(function(resultPage) {
        // Generate the context
        const initialState = JSONUtils.encodeOutputWithPage(output, resultPage);
        initialState.plugins = {
            resources: Plugins.listResources(plugins, resources).toJS()
        };

        /*context.template = {
            getJSContext() {
                return {
                    page: omit(context.page, 'content'),
                    config: context.config,
                    file: context.file,
                    gitbook: context.gitbook,
                    basePath,
                    book: {
                        language: book.getLanguage()
                    }
                };
            }
        };*/

        // We should probabbly move it to "template" or a "site" namespace
        // context.basePath = basePath;

        // Render the theme
        const html = render(initialState);

        // Write it to the disk
        return writeFile(output, filePath, html);
    });
}

module.exports = onPage;
