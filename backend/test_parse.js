import { parseWithGrok } from './services/grokService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testParse() {
  const query = "4 bhk in gift city gandhinagar";
  console.log(`Query: ${query}`);
  const result = await parseWithGrok(query);
  console.log('AI Parsed Result:');
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

testParse();
