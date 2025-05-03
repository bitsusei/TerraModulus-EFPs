import fs from 'fs/promises';
import path from 'path';
import { parseStringPromise } from 'xml2js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  // Construct the path to your XML file outside the root directory
  const xmlFilePath = path.resolve('../xml-sources', `${params.slug}.xml`);

  // Read the XML file content
  const xmlContent = await fs.readFile(xmlFilePath, 'utf-8');

  // Parse XML to JS object
  const data = await parseStringPromise(xmlContent);

  // Return the parsed data to the page as props
  return {
    pageData: data
  };
}
