# Inertia Linter — Development Environment Setup Summary

Date: 2026-02-14

---

## 1. Permission Configuration (Autonomous Execution)

### File: `.claude/settings.local.json`

Build/test/lint関連のBashコマンドを自動許可設定済み。
人間の承認なしで以下が実行可能:

| Category | Allowed Patterns |
|----------|-----------------|
| Dev Server | `npm run dev` |
| Build | `npm run build`, `npx vite` |
| Test | `npm run test`, `npm test`, `npx vitest` |
| Lint/Format | `npm run lint`, `npm run format`, `npx prettier`, `npx eslint` |
| Type Check | `npx tsc` |
| Install | `npm install`, `npm i`, `npm ci` |
| Scaffold | `npm create` |
| Preview | `npm run preview` |

**Tips参照元**: "パーミッションフック設定 → 10〜20時間放置して作らせる"

---

## 2. Project-Local Hooks

### File: `.claude/settings.local.json` > `hooks.PostToolUse`

#### Hook 1: PHI Leak Detector
- **Trigger**: `engine/`, `data/`, `types/` 配下の `.ts` ファイル作成・編集時
- **Action**: 外部API呼び出しパターン (fetch, axios, claude, anthropic) と患者データパターン (ef, egfr, sbp, hr, potassium, bnp) の共起を検出
- **Warning**: `[Hook] PHI LEAK WARNING: Patient data may be sent to external API!`
- **根拠**: DESIGN_SPEC Section 3.1 — "Patient numerical values NEVER leave the client"

#### Hook 2: No-Blame Language Check
- **Trigger**: `components/`, `hooks/` 配下の `.ts/.tsx` ファイル作成・編集時
- **Action**: UI向けコード内の非難的表現 (clinical inertia, physician fault, blame, negligence) を検出
- **Warning**: `[Hook] SAFETY WARNING: Accusatory language detected in UI!`
- **根拠**: DESIGN_SPEC Section 4.5 — "CLINICAL_INERTIA is NEVER shown to the user as 'clinical inertia'"

**Tips参照元**: "アクションの前後にスクリプトを差し込む" + 医療安全要件のカスタマイズ

---

## 3. Project Slash Commands

### Directory: `.claude/commands/`

| Command | File | Purpose | Tips参照元 |
|---------|------|---------|-----------|
| `/interview` | `interview.md` | DESIGN_SPEC.mdの曖昧点を対話的に解消。AskUserQuestionで1問ずつ深掘りし、DECISIONS.mdに記録 | "Claude Codeに自分をインタビューさせる" |
| `/build-critique` | `build-critique.md` | ビルド検証 -> Playwright視覚監査 -> 医療UIチェックリスト -> PASS/FAIL/IMPROVE報告 -> 反復 | "ビルダー用とデザイン批評用を分ける" |
| `/safety-audit` | `safety-audit.md` | 10 Safety Principles準拠の包括的監査。PHI、決定論性、非難言語、マルチガイドライン等を検証 | エラー修正第2段階: "CLAUDE.mdに直接追記" |
| `/validate-case` | `validate-case.md` | デモケース1-3の期待出力検証。DESIGN_SPECの期待値との差分を報告 | "テストを書かせて反復させる" |
| `/phi-check` | `phi-check.md` | API呼び出し、Storage、Logging、Analytics全方面のPHI漏洩スキャン | セキュリティの自己検証 |

---

## 4. CLAUDE.md Improvements

### File: `CLAUDE.md`

追加・改善した項目:

| Section | Content | Tips参照元 |
|---------|---------|-----------|
| Self-Verification | `npx tsc --noEmit && npm run test && npm run build` ワンライナー | "自己検証の仕組みを与える" |
| Project Commands | 5つのスラッシュコマンド一覧表 | "スキルを作ること自体が最強のスキル" |
| Active Hooks | プロジェクトローカルフック2つの説明 | CLAUDE.mdに道しるべを記載 |
| Development Workflow | Plan -> TDD -> Verify -> Safety -> Critique の5ステップ | "小さなバグ修正から始める" |
| Key References | DESIGN_SPEC.md, IMPLEMENTATION_PLAN.md へのリンク | "スペックはMarkdownファイルに書き出す" |

---

## 5. Global Settings (Pre-existing, Leveraged)

以下はグローバル設定 (`~/.claude/settings.json`) に既存で、本プロジェクトでも活用される:

| Setting | Impact on This Project |
|---------|----------------------|
| `alwaysThinkingEnabled: true` | エンジンロジック設計時の深い推論 |
| Prettier PostToolUse hook | JS/TS編集後の自動フォーマット |
| TypeScript check PostToolUse hook | `.ts/.tsx`編集後の自動型チェック |
| console.log warning hook | 患者データのログ出力防止に有効 |
| Dev server tmux blocker | devサーバーをtmuxで起動するよう強制 |
| Doc blocker hook | 不要な.mdファイル生成を防止 |
| Plugin: frontend-design | UIの美的品質向上（Opus 4.6の強み活用） |
| Plugin: playwright | ビルド＆批評ループの視覚テスト |
| Plugin: typescript-lsp | 型情報の即時フィードバック |
| Plugin: supabase | 将来的なバックエンド拡張に備え |
| Plugin: context7 | 最新ライブラリドキュメント参照 |

---

## 6. Recommended Workflow

```
開発セッション開始
  │
  ├─ 仕様確認が必要 ──→ /interview
  │
  ├─ 実装開始
  │   ├─ Plan Mode で設計合意
  │   ├─ TDD: RED → GREEN → REFACTOR
  │   ├─ 自動フック: PHI検出 + 非難言語チェック + Prettier + tsc
  │   └─ Self-Verification: tsc && test && build
  │
  ├─ フロントエンド実装
  │   ├─ frontend-design プラグイン活用
  │   ├─ /build-critique でビジュアルQA
  │   └─ 反復: FAIL → Fix → Re-run
  │
  ├─ デモ準備
  │   ├─ /validate-case all (3ケース検証)
  │   ├─ /safety-audit (10原則監査)
  │   └─ /phi-check (PHI漏洩スキャン)
  │
  └─ デプロイ
      ├─ npm run build
      └─ Vercel deploy
```

---

## 7. Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client-Side)                  │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Patient   │  │ Rule Engine  │  │ Visualization     │  │
│  │ Input     │→│ (Pure TS)    │→│ (React+Recharts)  │  │
│  │ (Zod)    │  │ Deterministic│  │ 3-Pane Dashboard  │  │
│  └──────────┘  └──────┬───────┘  └───────────────────┘  │
│                        │                                  │
│                 Abstract codes only                       │
│                 (NO patient values)                       │
│                        │                                  │
│                        ▼                                  │
│              ┌──────────────────┐                         │
│              │ Claude API       │                         │
│              │ (Explanation)    │                         │
│              │ AI-generated tag │                         │
│              └──────────────────┘                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Safety Layer: DEMO MODE | Disclaimer | Watermark │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```
