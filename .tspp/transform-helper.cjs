const fs = require('node:fs');
const ts = require('../node_modules/typescript/lib/typescript.js');

const [filePath] = process.argv.slice(2);

if (!filePath) {
  console.error('Missing file path.');
  process.exit(1);
}

const LIST_HELPER = '__tsppList';
const IS_SOME_HELPER = '__tsppIsSome';
const TO_ITERATOR_HELPER = '__tsppToIterator';
const sourceText = fs.readFileSync(filePath, 'utf8');
const sourceFile = ts.createSourceFile(
  filePath,
  sourceText,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);

let usesList = false;
let usesIsSome = false;
let usesToIterator = false;
let syntheticCounter = 0;
const assignmentOperators = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

function isWritableElementAccess(node) {
  const parent = node.parent;

  return (
    ts.isBinaryExpression(parent) &&
    parent.left === node &&
    assignmentOperators.has(parent.operatorToken.kind)
  );
}

const result = ts.transform(sourceFile, [
  (context) => {
    const visit = (node) => {
      if (ts.isArrayLiteralExpression(node)) {
        usesList = true;

        return ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(LIST_HELPER),
            'of',
          ),
          undefined,
          node.elements.map((element) => ts.visitNode(element, visit)),
        );
      }

      if (ts.isElementAccessExpression(node) && !isWritableElementAccess(node)) {
        return ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.visitNode(node.expression, visit),
            'at',
          ),
          undefined,
          [ts.visitNode(node.argumentExpression, visit)],
        );
      }

      if (ts.isForOfStatement(node)) {
        const initializer = node.initializer;

        if (
          ts.isVariableDeclarationList(initializer) &&
          initializer.declarations.length === 1
        ) {
          const declaration = initializer.declarations[0];

          if (
            ts.isIdentifier(declaration.name) &&
            declaration.initializer === undefined
          ) {
            usesIsSome = true;
            usesToIterator = true;

            const iterName = `__tsppIter${syntheticCounter}`;
            const valueName = `__tsppValue${syntheticCounter}`;
            syntheticCounter += 1;

            const iterIdentifier = ts.factory.createIdentifier(iterName);
            const valueIdentifier = ts.factory.createIdentifier(valueName);
            const itemIdentifier = declaration.name;
            const iterInitializer = ts.factory.createCallExpression(
              ts.factory.createIdentifier(TO_ITERATOR_HELPER),
              undefined,
              [ts.visitNode(node.expression, visit)],
            );
            const iterAdvance = ts.factory.createBinaryExpression(
              iterIdentifier,
              ts.SyntaxKind.EqualsToken,
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  iterIdentifier,
                  'next',
                ),
                undefined,
                [],
              ),
            );

            return ts.factory.createBlock([
              ts.factory.createForStatement(
                ts.factory.createVariableDeclarationList(
                  [
                    ts.factory.createVariableDeclaration(
                      iterIdentifier,
                      undefined,
                      undefined,
                      iterInitializer,
                    ),
                  ],
                  ts.NodeFlags.Let,
                ),
                ts.factory.createPrefixUnaryExpression(
                  ts.SyntaxKind.ExclamationToken,
                  ts.factory.createPropertyAccessExpression(
                    iterIdentifier,
                    'done',
                  ),
                ),
                iterAdvance,
                ts.factory.createBlock([
                  ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList(
                      [
                        ts.factory.createVariableDeclaration(
                          valueIdentifier,
                          undefined,
                          undefined,
                          ts.factory.createPropertyAccessExpression(
                            iterIdentifier,
                            'value',
                          ),
                        ),
                      ],
                      ts.NodeFlags.Const,
                    ),
                  ),
                  ts.factory.createIfStatement(
                    ts.factory.createCallExpression(
                      ts.factory.createIdentifier(IS_SOME_HELPER),
                      undefined,
                      [valueIdentifier],
                    ),
                    ts.factory.createBlock([
                      ts.factory.createVariableStatement(
                        undefined,
                        ts.factory.createVariableDeclarationList(
                          [
                            ts.factory.createVariableDeclaration(
                              itemIdentifier,
                              declaration.exclamationToken,
                              declaration.type,
                              ts.factory.createPropertyAccessExpression(
                                valueIdentifier,
                                'value',
                              ),
                            ),
                          ],
                          initializer.flags,
                        ),
                      ),
                      ts.visitNode(node.statement, visit),
                    ]),
                  ),
                ]),
              ),
            ]);
          }
        }
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (node) => ts.visitNode(node, visit);
  },
]);

let transformedSourceFile = result.transformed[0];

if (usesList || usesIsSome || usesToIterator) {
  const importSpecifiers = [];

  if (usesIsSome) {
    importSpecifiers.push(
      ts.factory.createImportSpecifier(
        false,
        ts.factory.createIdentifier('isSome'),
        ts.factory.createIdentifier(IS_SOME_HELPER),
      ),
    );
  }

  if (usesList) {
    importSpecifiers.push(
      ts.factory.createImportSpecifier(
        false,
        ts.factory.createIdentifier('List'),
        ts.factory.createIdentifier(LIST_HELPER),
      ),
    );
  }

  if (usesToIterator) {
    importSpecifiers.push(
      ts.factory.createImportSpecifier(
        false,
        ts.factory.createIdentifier('toIterator'),
        ts.factory.createIdentifier(TO_ITERATOR_HELPER),
      ),
    );
  }

  const importDeclaration = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports(importSpecifiers),
    ),
    ts.factory.createStringLiteral('#tspp/types'),
  );

  transformedSourceFile = ts.factory.updateSourceFile(
    transformedSourceFile,
    [importDeclaration, ...transformedSourceFile.statements],
  );
}

const printer = ts.createPrinter();
process.stdout.write(printer.printFile(transformedSourceFile));

result.dispose();
