import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import ts from 'typescript';

const [filePath, projectRootArg] = process.argv.slice(2);

if (!filePath) {
  console.error('Missing file path.');
  process.exit(1);
}

const projectRoot = projectRootArg ?? process.cwd();
const LIST_HELPER = '__tsppList';
const IS_SOME_HELPER = '__tsppIsSome';
const TO_ITERATOR_HELPER = '__tsppToIterator';
const helperSuffixByOperator = new Map([
  [ts.SyntaxKind.PlusToken, 'Add'],
  [ts.SyntaxKind.MinusToken, 'Subtract'],
  [ts.SyntaxKind.AsteriskToken, 'Multiply'],
  [ts.SyntaxKind.SlashToken, 'Divide'],
  [ts.SyntaxKind.PercentToken, 'Remainder'],
  [ts.SyntaxKind.AmpersandToken, 'BitwiseAnd'],
  [ts.SyntaxKind.BarToken, 'BitwiseOr'],
  [ts.SyntaxKind.CaretToken, 'BitwiseXor'],
  [ts.SyntaxKind.LessThanLessThanToken, 'LeftShift'],
  [ts.SyntaxKind.GreaterThanGreaterThanToken, 'RightShift'],
]);
const unaryHelperSuffixByOperator = new Map([
  [ts.SyntaxKind.PlusToken, 'Positive'],
  [ts.SyntaxKind.MinusToken, 'Negate'],
  [ts.SyntaxKind.TildeToken, 'BitwiseNot'],
]);
const comparisonSuffixByOperator = new Map([
  [ts.SyntaxKind.LessThanToken, 'LessThan'],
  [ts.SyntaxKind.LessThanEqualsToken, 'LessThanOrEqual'],
  [ts.SyntaxKind.GreaterThanToken, 'GreaterThan'],
  [ts.SyntaxKind.GreaterThanEqualsToken, 'GreaterThanOrEqual'],
  [ts.SyntaxKind.EqualsEqualsToken, 'Equal'],
  [ts.SyntaxKind.EqualsEqualsEqualsToken, 'Equal'],
  [ts.SyntaxKind.ExclamationEqualsToken, 'NotEqual'],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, 'NotEqual'],
]);
const fixedNumberKinds = new Set([
  'float64',
  'i8',
  'u8',
  'i16',
  'u16',
  'i32',
  'u32',
  'i64',
  'u64',
]);
type FixedNumberKind =
  | 'float64'
  | 'i8'
  | 'u8'
  | 'i16'
  | 'u16'
  | 'i32'
  | 'u32'
  | 'i64'
  | 'u64';
const integerOnlyHelperSuffixes = new Set([
  'BitwiseAnd',
  'BitwiseOr',
  'BitwiseXor',
  'BitwiseNot',
  'LeftShift',
  'RightShift',
]);
const sourceText = readFileSync(filePath, 'utf8');
const configPath = join(projectRoot, '.tspp', 'config', 'tsconfig.user.json');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

if (configFile.error) {
  const message = ts.flattenDiagnosticMessageText(
    configFile.error.messageText,
    '\n',
  );

  console.error(message);
  process.exit(1);
}

const parsedConfig = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  dirname(configPath),
);
const program = ts.createProgram(
  parsedConfig.fileNames.includes(filePath)
    ? parsedConfig.fileNames
    : [filePath, ...parsedConfig.fileNames],
  parsedConfig.options,
);
const checker = program.getTypeChecker();
const sourceFile =
  program.getSourceFile(filePath) ??
  ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

let usesList = false;
let usesIsSome = false;
let usesToIterator = false;
const usedNumberHelpers = new Set<string>();
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

function isWritableElementAccess(node: ts.ElementAccessExpression): boolean {
  const parent = node.parent;

  return (
    ts.isBinaryExpression(parent) &&
    parent.left === node &&
    assignmentOperators.has(parent.operatorToken.kind)
  );
}

function visitExpression<T extends ts.Expression>(
  node: T,
  visitor: ts.Visitor,
): T {
  return ts.visitNode(node, visitor) as T;
}

function getFixedNumberKind(node: ts.Node): FixedNumberKind | undefined {
  const type = checker.getTypeAtLocation(node);
  const symbol = type.aliasSymbol ?? type.symbol;
  const name = symbol?.getName();

  if (name && fixedNumberKinds.has(name)) {
    return name as FixedNumberKind;
  }

  return undefined;
}

function assertSameFixedNumberKinds(
  left: ts.Node,
  right: ts.Node,
): FixedNumberKind | undefined {
  const leftKind = getFixedNumberKind(left);
  const rightKind = getFixedNumberKind(right);

  if (!leftKind && !rightKind) {
    return undefined;
  }

  if (leftKind && rightKind && leftKind === rightKind) {
    return leftKind;
  }

  throw new Error(
    `Fixed-width number operations require matching operands in ${filePath}.`,
  );
}

function kindToHelperPrefix(kind: FixedNumberKind): string {
  return kind === 'float64'
    ? 'Float64'
    : kind.charAt(0).toUpperCase() + kind.slice(1);
}

function createNumberHelperCall(
  kind: FixedNumberKind,
  suffix: string,
  args: ts.Expression[],
): ts.CallExpression {
  if (kind === 'float64' && integerOnlyHelperSuffixes.has(suffix)) {
    throw new Error(`float64 does not support ${suffix} in ${filePath}.`);
  }

  const helperName = `__tspp${kindToHelperPrefix(kind)}${suffix}`;
  usedNumberHelpers.add(helperName);

  return ts.factory.createCallExpression(
    ts.factory.createIdentifier(helperName),
    undefined,
    args,
  );
}

const result = ts.transform(sourceFile, [
  (context) => {
    const visit: ts.Visitor = (node): ts.VisitResult<ts.Node> => {
      if (ts.isPrefixUnaryExpression(node)) {
        const kind = getFixedNumberKind(node.operand);
        const suffix = unaryHelperSuffixByOperator.get(node.operator);

        if (kind && suffix) {
          return createNumberHelperCall(kind, suffix, [
            visitExpression(node.operand, visit),
          ]);
        }
      }

      if (ts.isBinaryExpression(node)) {
        const suffix = helperSuffixByOperator.get(node.operatorToken.kind);

        if (suffix) {
          const kind = assertSameFixedNumberKinds(node.left, node.right);

          if (kind) {
            return createNumberHelperCall(kind, suffix, [
              visitExpression(node.left, visit),
              visitExpression(node.right, visit),
            ]);
          }
        }

        const comparisonSuffix = comparisonSuffixByOperator.get(
          node.operatorToken.kind,
        );

        if (comparisonSuffix) {
          const kind = assertSameFixedNumberKinds(node.left, node.right);

          if (kind) {
            return createNumberHelperCall(kind, comparisonSuffix, [
              visitExpression(node.left, visit),
              visitExpression(node.right, visit),
            ]);
          }
        }
      }

      if (ts.isArrayLiteralExpression(node)) {
        usesList = true;

        return ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(LIST_HELPER),
            'of',
          ),
          undefined,
          node.elements.map((element) => visitExpression(element, visit)),
        );
      }

      if (
        ts.isElementAccessExpression(node) &&
        !isWritableElementAccess(node)
      ) {
        return ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            visitExpression(node.expression, visit),
            'at',
          ),
          undefined,
          [visitExpression(node.argumentExpression, visit)],
        );
      }

      if (ts.isForOfStatement(node)) {
        const initializer = node.initializer;

        if (
          ts.isVariableDeclarationList(initializer) &&
          initializer.declarations.length === 1
        ) {
          const declaration = initializer.declarations[0];

          if (!declaration) {
            return ts.visitEachChild(node, visit, context);
          }

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
              [visitExpression(node.expression, visit)],
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
                      ts.visitNode(node.statement, visit) as ts.Statement,
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

    return (node) => ts.visitNode(node, visit) as ts.SourceFile;
  },
]);

let transformedSourceFile = result.transformed[0] as ts.SourceFile;

if (usesList || usesIsSome || usesToIterator || usedNumberHelpers.size > 0) {
  const importSpecifiers: ts.ImportSpecifier[] = [];

  for (const helperName of [...usedNumberHelpers].sort()) {
    importSpecifiers.push(
      ts.factory.createImportSpecifier(
        false,
        undefined,
        ts.factory.createIdentifier(helperName),
      ),
    );
  }

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

  transformedSourceFile = ts.factory.updateSourceFile(transformedSourceFile, [
    importDeclaration,
    ...transformedSourceFile.statements,
  ]);
}

const printer = ts.createPrinter();
process.stdout.write(printer.printFile(transformedSourceFile));

result.dispose();
