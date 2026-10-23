import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@babel/parser';

test('JSX display text has no forbidden pending label', () => {
  const failures = [];
  function walk(node, filename) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXText' && /\bloading\b/i.test(node.value)) failures.push(filename + ':' + node.loc.start.line);
    if (node.type === 'StringLiteral' && /^loading\b/i.test(node.value) && !/^loading[-_]/i.test(node.value)) failures.push(filename + ':' + node.loc.start.line);
    if (node.type === 'TemplateElement' && /\bLoading\s/.test(node.value.raw)) failures.push(filename + ':' + node.loc.start.line);
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc') continue;
      if (Array.isArray(value)) value.forEach(child => walk(child, filename));
      else if (value && typeof value === 'object') walk(value, filename);
    }
  }
  function scan(dir) {
    for (const file of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, file.name);
      if (file.isDirectory()) scan(path);
      else if (file.name.endsWith('.jsx')) walk(parse(readFileSync(path, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }), path);
    }
  }
  scan(new URL('..', import.meta.url).pathname);
  assert.deepEqual(failures, []);
});
