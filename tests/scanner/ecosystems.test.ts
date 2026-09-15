import { describe, expect, it } from 'vitest';

import { unknownTechnology } from '../../src/core/technology.js';
import { scanTechnology, type TechnologyScan } from '../../src/scanner/technology.js';
import { useTempDir, writeFiles } from '../helpers.js';

describe('scanTechnology', () => {
  const projectDir = useTempDir();
  const scan = async (files: Record<string, string>): Promise<TechnologyScan> => {
    await writeFiles(projectDir(), files);
    return scanTechnology(projectDir());
  };

  it('reports everything as unknown when there are no project files', async () => {
    expect(await scan({ 'notes.txt': 'hello' })).toEqual({
      technology: unknownTechnology(),
      manifests: [],
      sources: [],
    });
  });

  it('does not pick one of several kinds of project', async () => {
    const result = await scan({ 'package.json': '{}', 'go.mod': 'module example.com/app\n' });

    expect(result.technology).toEqual(unknownTechnology());
    expect(result.manifests).toEqual(['package.json', 'go.mod']);
  });

  it('only looks at the project root', async () => {
    const result = await scan({ 'tools/package.json': '{}' });

    expect(result.manifests).toEqual([]);
  });

  describe('pom.xml', () => {
    it('detects a Spring Boot project', async () => {
      const result = await scan({
        'pom.xml': `<project>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
  </parent>
  <groupId>com.example</groupId>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`,
      });

      expect(result).toEqual({
        technology: {
          language: 'java',
          runtime: 'jvm',
          packageManager: 'maven',
          framework: 'spring-boot',
          testFramework: 'junit',
        },
        manifests: ['pom.xml'],
        sources: ['pom.xml'],
      });
    });

    it('detects Kotlin from its Maven plugin', async () => {
      const result = await scan({
        'pom.xml':
          '<project><build><plugins><plugin><groupId>org.jetbrains.kotlin</groupId><artifactId>kotlin-maven-plugin</artifactId></plugin></plugins></build></project>',
      });

      expect(result.technology.language).toBe('kotlin');
    });

    it('ignores commented-out dependencies', async () => {
      const result = await scan({
        'pom.xml':
          '<project><!-- <dependency><groupId>io.quarkus</groupId></dependency> --></project>',
      });

      expect(result.technology.framework).toBeNull();
      expect(result.technology.testFramework).toBeNull();
    });

    it('does not claim "none" for a multi-module parent', async () => {
      const result = await scan({
        'pom.xml': '<project><modules><module>api</module></modules></project>',
      });

      expect(result.technology.framework).toBe('unknown');
      expect(result.technology.testFramework).toBe('unknown');
    });
  });

  describe('pubspec.yaml', () => {
    it('detects a Flutter app', async () => {
      const result = await scan({
        'pubspec.yaml': `name: app
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  test: ^1.25.0
`,
      });

      expect(result.technology).toEqual({
        language: 'dart',
        runtime: 'dart',
        packageManager: 'pub',
        framework: 'flutter',
        testFramework: 'flutter_test',
      });
    });

    it('detects a plain Dart package', async () => {
      const result = await scan({
        'pubspec.yaml': `name: tool
# The top-level flutter: section below is settings, not a dependency.
flutter:
  uses-material-design: true
dependencies:
  path: ^1.9.0
dev_dependencies:
  test: ^1.25.0
`,
      });

      expect(result.technology.framework).toBeNull();
      expect(result.technology.testFramework).toBe('dart_test');
    });
  });

  describe('Cargo.toml', () => {
    it('detects a Rust web service', async () => {
      const result = await scan({
        'Cargo.toml': `[package]
name = "api"

[dependencies] # runtime crates
axum = "0.8"
tokio = { version = "1", features = [
  "full",
] }
`,
      });

      expect(result.technology).toEqual({
        language: 'rust',
        runtime: null,
        packageManager: 'cargo',
        framework: 'axum',
        testFramework: 'cargo-test',
      });
    });

    it('reads dependencies declared as their own table', async () => {
      const result = await scan({
        'Cargo.toml': '[package]\nname = "web"\n\n[dependencies.rocket]\nversion = "0.5"\n',
      });

      expect(result.technology.framework).toBe('rocket');
    });

    it('does not claim "none" for a virtual workspace', async () => {
      const result = await scan({ 'Cargo.toml': '[workspace]\nmembers = ["api"]\n' });

      expect(result.technology.framework).toBe('unknown');
    });
  });

  describe('go.mod', () => {
    it('detects a Go web service and skips indirect requirements', async () => {
      const result = await scan({
        'go.mod': `module example.com/api

go 1.23

require (
	github.com/gin-gonic/gin v1.10.0
	github.com/labstack/echo/v4 v4.12.0 // indirect
)
`,
      });

      expect(result.technology).toEqual({
        language: 'go',
        runtime: null,
        packageManager: 'go',
        framework: 'gin',
        testFramework: 'go-test',
      });
    });

    it('reads single-line requirements with a major version suffix', async () => {
      const result = await scan({
        'go.mod': 'module example.com/api\n\nrequire github.com/go-chi/chi/v5 v5.1.0\n',
      });

      expect(result.technology.framework).toBe('chi');
    });

    it('is null without a known framework', async () => {
      const result = await scan({ 'go.mod': 'module example.com/tool\n\ngo 1.23\n' });

      expect(result.technology.framework).toBeNull();
    });
  });
});
