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
const fixedNumberKinds = new Set([
  'i8',
  'u8',
  'i16',
  'u16',
  'i32',
  'u32',
  'i64',
  'u64',
  'i128',
  'u128',
]);
type FixedNumberKind =
  | 'i8'
  | 'u8'
  | 'i16'
  | 'u16'
  | 'i32'
  | 'u32'
  | 'i64'
  | 'u64'
  | 'i128'
  | 'u128';
const bigFixedNumberKinds = new Set(['i64', 'u64', 'i128', 'u128']);
const unsignedFixedNumberKinds = new Set(['u8', 'u16', 'u32', 'u64', 'u128']);
const binaryNumberHelpers = new Map([
  [ts.SyntaxKind.PlusToken, '__tsppNumberAdd'],
  [ts.SyntaxKind.MinusToken, '__tsppNumberSubtract'],
  [ts.SyntaxKind.AsteriskToken, '__tsppNumberMultiply'],
  [ts.SyntaxKind.AsteriskAsteriskToken, '__tsppNumberExponentiate'],
  [ts.SyntaxKind.SlashToken, '__tsppNumberDivide'],
  [ts.SyntaxKind.PercentToken, '__tsppNumberRemainder'],
  [ts.SyntaxKind.AmpersandToken, '__tsppNumberBitwiseAnd'],
  [ts.SyntaxKind.BarToken, '__tsppNumberBitwiseOr'],
  [ts.SyntaxKind.CaretToken, '__tsppNumberBitwiseXor'],
  [ts.SyntaxKind.LessThanLessThanToken, '__tsppNumberLeftShift'],
  [ts.SyntaxKind.GreaterThanGreaterThanToken, '__tsppNumberRightShift'],
  [
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
    '__tsppNumberUnsignedRightShift',
  ],
]);
const assignmentNumberHelpers = new Map([
  [ts.SyntaxKind.PlusEqualsToken, '__tsppNumberAdd'],
  [ts.SyntaxKind.MinusEqualsToken, '__tsppNumberSubtract'],
  [ts.SyntaxKind.AsteriskEqualsToken, '__tsppNumberMultiply'],
  [ts.SyntaxKind.AsteriskAsteriskEqualsToken, '__tsppNumberExponentiate'],
  [ts.SyntaxKind.SlashEqualsToken, '__tsppNumberDivide'],
  [ts.SyntaxKind.PercentEqualsToken, '__tsppNumberRemainder'],
  [ts.SyntaxKind.AmpersandEqualsToken, '__tsppNumberBitwiseAnd'],
  [ts.SyntaxKind.BarEqualsToken, '__tsppNumberBitwiseOr'],
  [ts.SyntaxKind.CaretEqualsToken, '__tsppNumberBitwiseXor'],
  [ts.SyntaxKind.LessThanLessThanEqualsToken, '__tsppNumberLeftShift'],
  [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken, '__tsppNumberRightShift'],
  [
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    '__tsppNumberUnsignedRightShift',
  ],
]);
const comparisonOperators = new Set([
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
]);
const unaryNumberHelpers = new Map([
  [ts.SyntaxKind.PlusToken, '__tsppNumberPositive'],
  [ts.SyntaxKind.MinusToken, '__tsppNumberNegate'],
  [ts.SyntaxKind.TildeToken, '__tsppNumberBitwiseNot'],
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

function formatLocation(node: ts.Node): string {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );

  return `${filePath}:${line + 1}:${character + 1}`;
}

function getFixedNumberKind(node: ts.Node): FixedNumberKind | undefined {
  const type = checker.getTypeAtLocation(node);
  const symbol = type.aliasSymbol ?? type.symbol;
  const name = symbol?.getName();

  if (fixedNumberKinds.has(name)) {
    return name as FixedNumberKind;
  }

  return undefined;
}

function getFixedNumberKindFromTypeNode(
  node: ts.TypeNode | undefined,
): FixedNumberKind | undefined {
  if (!node) {
    return undefined;
  }

  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    const name = node.typeName.text;

    if (fixedNumberKinds.has(name)) {
      return name as FixedNumberKind;
    }
  }

  return undefined;
}

function isFixedNumberLiteralInitializer(node: ts.Node): boolean {
  if (ts.isNumericLiteral(node) || ts.isBigIntLiteral(node)) {
    return true;
  }

  return (
    ts.isPrefixUnaryExpression(node) &&
    (node.operator === ts.SyntaxKind.PlusToken ||
      node.operator === ts.SyntaxKind.MinusToken) &&
    (ts.isNumericLiteral(node.operand) || ts.isBigIntLiteral(node.operand))
  );
}

function isNegativeExpression(node: ts.Node): boolean {
  return (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken
  );
}

function isNumberConstructorCall(node: ts.Node): boolean {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    fixedNumberKinds.has(node.expression.text)
  );
}

function isBareNumberLiteral(node: ts.Node): boolean {
  return (
    isFixedNumberLiteralInitializer(node) &&
    !isNumberConstructorCall(node.parent)
  );
}

function assertUnsignedInitializerIsNotNegative(
  kind: FixedNumberKind,
  value: ts.Node,
): void {
  if (unsignedFixedNumberKinds.has(kind) && isNegativeExpression(value)) {
    throw new Error(
      `Unsigned fixed-width numbers cannot be initialized with negative values at ${formatLocation(value)}.`,
    );
  }
}

function assertSameFixedNumberKinds(
  left: ts.Node,
  right: ts.Node,
  node: ts.Node,
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
    `Fixed-width number operations require matching operands at ${formatLocation(node)}.`,
  );
}

function createNumberConstructorCall(
  kind: FixedNumberKind,
  value: ts.Expression,
): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createIdentifier(kind),
    undefined,
    [value],
  );
}

function createBigFixedNumberInitializer(
  kind: FixedNumberKind,
  value: ts.Expression,
): ts.Expression {
  if (!bigFixedNumberKinds.has(kind) || ts.isBigIntLiteral(value)) {
    return value;
  }

  if (ts.isNumericLiteral(value)) {
    return ts.factory.createBigIntLiteral(`${value.text}n`);
  }

  if (ts.isPrefixUnaryExpression(value) && ts.isNumericLiteral(value.operand)) {
    const bigint = ts.factory.createBigIntLiteral(`${value.operand.text}n`);

    if (value.operator === ts.SyntaxKind.PlusToken) {
      return bigint;
    }

    if (value.operator === ts.SyntaxKind.MinusToken) {
      return ts.factory.createPrefixUnaryExpression(
        ts.SyntaxKind.MinusToken,
        bigint,
      );
    }
  }

  return value;
}

function createFixedNumberCall(
  helperName: string,
  kind: FixedNumberKind,
  args: ts.Expression[],
): ts.CallExpression {
  usedNumberHelpers.add(helperName);

  return ts.factory.createCallExpression(
    ts.factory.createIdentifier(helperName),
    undefined,
    [ts.factory.createStringLiteral(kind), ...args],
  );
}

function visitExpression<T extends ts.Expression>(
  node: T,
  visitor: ts.Visitor,
): T {
  return ts.visitNode(node, visitor) as T;
}

const result = ts.transform(sourceFile, [
  (context) => {
    const visit: ts.Visitor = (node): ts.VisitResult<ts.Node> => {
      if (ts.isVariableDeclaration(node)) {
        const kind = getFixedNumberKindFromTypeNode(node.type);

        if (
          kind &&
          node.initializer &&
          isFixedNumberLiteralInitializer(node.initializer)
        ) {
          assertUnsignedInitializerIsNotNegative(kind, node.initializer);

          const initializer = createBigFixedNumberInitializer(
            kind,
            visitExpression(node.initializer, visit),
          );

          return ts.factory.updateVariableDeclaration(
            node,
            node.name,
            node.exclamationToken,
            node.type,
            createNumberConstructorCall(kind, initializer),
          );
        }

        if (
          !kind &&
          node.initializer &&
          isBareNumberLiteral(node.initializer)
        ) {
          throw new Error(
            `Numeric variable initializers require a fixed-width annotation or constructor at ${formatLocation(node.initializer)}.`,
          );
        }
      }

      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        unsignedFixedNumberKinds.has(node.expression.text) &&
        node.arguments.length > 0
      ) {
        const argument = node.arguments[0];

        if (!argument) {
          return ts.visitEachChild(node, visit, context);
        }

        assertUnsignedInitializerIsNotNegative(
          node.expression.text as FixedNumberKind,
          argument,
        );
      }

      if (ts.isPrefixUnaryExpression(node)) {
        const helperName = unaryNumberHelpers.get(node.operator);
        const kind = getFixedNumberKind(node.operand);

        if (helperName && kind) {
          return createFixedNumberCall(helperName, kind, [
            visitExpression(node.operand, visit),
          ]);
        }
      }

      if (ts.isBinaryExpression(node)) {
        const helperName = binaryNumberHelpers.get(node.operatorToken.kind);

        if (helperName) {
          const kind = assertSameFixedNumberKinds(node.left, node.right, node);

          if (kind) {
            return createFixedNumberCall(helperName, kind, [
              visitExpression(node.left, visit),
              visitExpression(node.right, visit),
            ]);
          }
        }

        const assignmentHelperName = assignmentNumberHelpers.get(
          node.operatorToken.kind,
        );

        if (assignmentHelperName) {
          const kind = assertSameFixedNumberKinds(node.left, node.right, node);

          if (kind) {
            return ts.factory.createAssignment(
              visitExpression(node.left, visit),
              createFixedNumberCall(assignmentHelperName, kind, [
                visitExpression(node.left, visit),
                visitExpression(node.right, visit),
              ]),
            );
          }
        }

        if (
          node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          isBareNumberLiteral(node.right)
        ) {
          throw new Error(
            `Numeric assignments require a fixed-width constructor at ${formatLocation(node.right)}.`,
          );
        }

        if (comparisonOperators.has(node.operatorToken.kind)) {
          assertSameFixedNumberKinds(node.left, node.right, node);
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
