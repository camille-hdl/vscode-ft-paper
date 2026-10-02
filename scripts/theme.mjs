// Theme specification, written in palette roles and never in hex.

import { alphaByte, ansiNames } from "./palette.mjs"

export const buildTheme = ({ name, type, palette, fillRecipes, terminal }) => {

  const c = (role) => {
    if (!(role in palette)) throw new Error(`unknown role: ${role}`)
    return palette[role]
  }

  /** Palette hue made translucent; every transparency carries its reason. */
  const a = (role, alpha, why) => ({ hex: c(role) + alphaByte(alpha), why: `${role} at ${Math.round(alpha * 1000) / 10}% — ${why}` })

  /** Published hue/alpha recipe; optional alpha accounts for a stacked highlight. */
  const fill = (role, why = "VS Code requires a translucent color here", nightAlpha) => {
    const { base, hex, alpha: recipeAlpha } = fillRecipes[role]
    const alpha = type === "dark" ? nightAlpha ?? recipeAlpha : recipeAlpha
    return {
      hex: hex + alphaByte(alpha),
      why: `${role} (${base} at ${Math.round(alpha * 100)}%: ${alpha === recipeAlpha ? "same recipe as the palette" : "adjusted for overlapping highlights"}, gives ${c(role)} at its published opacity over paper) — ${why}`,
    }
  }

  // ---------------------------------------------------------------- interface

  const ui = {
    // Base
    focusBorder: c("oxford"),
    foreground: c("ink"),
    disabledForeground: c("ink-disabled"),
    descriptionForeground: c("ink-muted"),
    errorForeground: c("crimson"),
    "icon.foreground": c("ink-2"),
    "selection.background": c("surface-2"),
    "widget.border": c("rule"),
    "widget.shadow": a("ink", 0.12, "widget drop shadow: an opaque shadow would be a flat block"),
    "sash.hoverBorder": c("oxford"),
    "textLink.foreground": c("oxford"),
    "textLink.activeForeground": c("claret"),
    "textBlockQuote.background": c("paper-raised"),
    "textBlockQuote.border": c("rule"),
    "textCodeBlock.background": c("surface-2"),
    "textPreformat.foreground": c("ink"),
    "textPreformat.background": c("surface-2"),
    "textSeparator.foreground": c("rule"),

    // Title bar
    "titleBar.activeBackground": c("surface-1"),
    "titleBar.activeForeground": c("ink-2"),
    "titleBar.inactiveBackground": c("surface-1"),
    "titleBar.inactiveForeground": c("ink-muted"),
    "titleBar.border": c("rule"),

    // Activity bar
    "activityBar.background": c("surface-1"),
    "activityBar.foreground": c("ink-2"),
    "activityBar.inactiveForeground": c("ink-muted"),
    "activityBar.border": c("rule"),
    "activityBar.activeBorder": c("oxford"),
    "activityBarBadge.background": c("oxford"),
    "activityBarBadge.foreground": c("paper"),

    // Side bar
    "sideBar.background": c("surface-1"),
    "sideBar.foreground": c("ink"),
    "sideBar.border": c("rule"),
    "sideBar.dropBackground": fill("fill-change", "drop target, translucency required"),
    "sideBarTitle.foreground": c("ink-2"),
    "sideBarSectionHeader.background": c("surface-1"),
    "sideBarSectionHeader.foreground": c("ink-2"),
    "sideBarSectionHeader.border": c("rule"),

    // Lists and trees
    "list.activeSelectionBackground": c("surface-2"),
    "list.activeSelectionForeground": c("ink"),
    "list.inactiveSelectionBackground": c("surface-2"),
    "list.inactiveSelectionForeground": c("ink"),
    "list.hoverBackground": c("paper"),
    "list.hoverForeground": c("ink"),
    "list.focusOutline": c("oxford"),
    "list.focusBackground": c("surface-2"),
    "list.highlightForeground": c("claret"),
    "list.focusHighlightForeground": c("claret"),
    "list.errorForeground": c("crimson"),
    "list.warningForeground": c("mandarin"),
    "list.filterMatchBackground": fill("fill-match", "filter match, the \"every hit of a search\" role"),
    "list.dropBackground": c("surface-3"),
    "tree.indentGuidesStroke": c("rule"),
    "tree.inactiveIndentGuidesStroke": c("surface-3"),

    // Editor groups and tabs
    "editorGroup.border": c("rule"),
    "editorGroup.dropBackground": fill("fill-change", "drop target: content must stay visible underneath"),
    "editorGroupHeader.tabsBackground": c("surface-1"),
    "editorGroupHeader.tabsBorder": c("rule"),
    "editorGroupHeader.noTabsBackground": c("paper"),
    "tab.activeBackground": c("paper"),
    "tab.activeForeground": c("ink"),
    "tab.activeBorderTop": c("claret"),
    "tab.unfocusedActiveBorderTop": c("rule"),
    "tab.unfocusedActiveBackground": c("paper"),
    "tab.unfocusedActiveForeground": c("ink-2"),
    "tab.inactiveBackground": c("surface-1"),
    "tab.inactiveForeground": c("ink-muted"),
    "tab.unfocusedInactiveForeground": c("ink-muted"),
    "tab.hoverBackground": c("surface-2"),
    "tab.border": c("rule"),
    "tab.lastPinnedBorder": c("rule"),
    "breadcrumb.background": c("paper"),
    "breadcrumb.foreground": c("ink-muted"),
    "breadcrumb.focusForeground": c("ink"),
    "breadcrumb.activeSelectionForeground": c("ink"),
    "breadcrumbPicker.background": c("paper-raised"),

    // Editor
    "editor.background": c("paper"),
    "editor.foreground": c("ink"),
    "editorLineNumber.foreground": c("ink-muted"),
    "editorLineNumber.activeForeground": c("ink-2"),
    "editorCursor.foreground": c("ink"),
    "editor.selectionBackground": c("surface-2"),
    "editor.inactiveSelectionBackground": a("rule", 0.3, "selection in an unfocused editor, translucency required"),
    "editor.selectionHighlightBackground": a("rule", 0.25, "other occurrences of the selection, translucency required"),
    "editor.wordHighlightBackground": a("rule", 0.25, "symbol references, translucency required"),
    "editor.wordHighlightStrongBackground": a("rule", 0.4, "symbol writes, stronger than references; translucency required"),
    "editor.wordHighlightTextBackground": a("rule", 0.25, "textual occurrences, translucency required"),
    "editor.lineHighlightBorder": c("surface-3"),
    "editor.rangeHighlightBackground": a("rule", 0.2, "highlighted range, translucency required"),
    "editor.hoverHighlightBackground": a("rule", 0.2, "word under the hover, translucency required"),
    "editor.symbolHighlightBackground": a("rule", 0.25, "targeted symbol, translucency required"),
    "editor.foldBackground": a("rule", 0.15, "folded range, translucency required"),
    "editor.findMatchBackground": fill("fill-target", "the current match; translucent so the selection shows through"),
    "editor.findMatchHighlightBackground": fill("fill-match"),
    "editor.findRangeHighlightBackground": a("rule", 0.2, "search scope, translucency required"),
    "searchEditor.findMatchBackground": fill("fill-match", "search editor results"),
    "editorWhitespace.foreground": c("rule"),
    "editorIndentGuide.background1": c("surface-3"),
    "editorIndentGuide.activeBackground1": c("rule"),
    "editorRuler.foreground": c("surface-3"),
    "editorBracketMatch.background": c("surface-2"),
    "editorBracketMatch.border": c("claret"),
    "editorBracketHighlight.foreground1": c("ink-muted"),
    "editorBracketHighlight.foreground2": c("ink-muted"),
    "editorBracketHighlight.foreground3": c("ink-muted"),
    "editorBracketHighlight.foreground4": c("ink-muted"),
    "editorBracketHighlight.foreground5": c("ink-muted"),
    "editorBracketHighlight.foreground6": c("ink-muted"),
    "editorBracketHighlight.unexpectedBracket.foreground": c("crimson"),
    "editorCodeLens.foreground": c("ink-muted"),
    "editorInlayHint.foreground": c("ink-muted"),
    "editorInlayHint.background": c("surface-1"),
    "editorGhostText.foreground": c("ink-muted"),
    "editorLink.activeForeground": c("oxford"),
    "editorError.foreground": c("crimson"),
    "editorWarning.foreground": c("mandarin"),
    "editorInfo.foreground": c("oxford"),
    "editorHint.foreground": c("teal"),
    "editorGutter.background": c("paper"),
    "editorGutter.addedBackground": c("jade"),
    "editorGutter.modifiedBackground": c("oxford"),
    "editorGutter.deletedBackground": c("crimson"),
    "editorGutter.foldingControlForeground": c("ink-muted"),
    "editorStickyScroll.background": c("paper"),
    "editorStickyScrollHover.background": c("surface-1"),

    // Overview ruler, minimap, scrollbars
    "editorOverviewRuler.border": c("surface-3"),
    "editorOverviewRuler.addedForeground": a("jade", 0.6, "overview marker, lets overlapping markers show"),
    "editorOverviewRuler.modifiedForeground": a("oxford", 0.6, "overview marker, lets overlapping markers show"),
    "editorOverviewRuler.deletedForeground": a("crimson", 0.6, "overview marker, lets overlapping markers show"),
    "editorOverviewRuler.errorForeground": c("crimson"),
    "editorOverviewRuler.warningForeground": c("mandarin"),
    "editorOverviewRuler.infoForeground": c("oxford"),
    "editorOverviewRuler.findMatchForeground": a("mandarin-bright", 0.7, "match marker, fill-match hue; translucency required"),
    "editorOverviewRuler.selectionHighlightForeground": a("rule", 0.7, "occurrence marker, translucency required"),
    "editorOverviewRuler.wordHighlightForeground": a("rule", 0.7, "reference marker, translucency required"),
    "editorOverviewRuler.wordHighlightStrongForeground": a("ink-2", 0.5, "write marker, translucency required"),
    "minimap.background": c("paper"),
    "minimap.findMatchHighlight": a("mandarin-bright", 0.7, "matches in the minimap, fill-match hue"),
    "minimap.selectionHighlight": a("rule", 0.7, "selection in the minimap"),
    "minimap.errorHighlight": a("crimson", 0.7, "errors in the minimap"),
    "minimap.warningHighlight": a("mandarin", 0.7, "warnings in the minimap"),
    "minimapGutter.addedBackground": c("jade"),
    "minimapGutter.modifiedBackground": c("oxford"),
    "minimapGutter.deletedBackground": c("crimson"),
    "minimapSlider.background": a("rule", 0.3, "minimap slider: code must stay visible underneath"),
    "minimapSlider.hoverBackground": a("rule", 0.45, "minimap slider, hovered"),
    "minimapSlider.activeBackground": a("rule", 0.6, "minimap slider, dragged"),
    "scrollbar.shadow": a("ink", 0.1, "scroll shadow"),
    "scrollbarSlider.background": a("rule", 0.4, "scrollbar slider: code must stay visible underneath"),
    "scrollbarSlider.hoverBackground": a("rule", 0.6, "scrollbar slider, hovered"),
    "scrollbarSlider.activeBackground": a("rule", 0.8, "scrollbar slider, dragged"),

    // Editor widgets (hover, suggestions, find)
    "editorWidget.background": c("paper-raised"),
    "editorWidget.foreground": c("ink"),
    "editorWidget.border": c("rule"),
    "editorSuggestWidget.background": c("paper-raised"),
    "editorSuggestWidget.border": c("rule"),
    "editorSuggestWidget.foreground": c("ink"),
    "editorSuggestWidget.selectedBackground": c("surface-3"),
    "editorSuggestWidget.selectedForeground": c("ink"),
    "editorSuggestWidget.highlightForeground": c("claret"),
    "editorSuggestWidget.focusHighlightForeground": c("claret"),
    "editorHoverWidget.background": c("paper-raised"),
    "editorHoverWidget.foreground": c("ink"),
    "editorHoverWidget.border": c("rule"),
    "editorHoverWidget.statusBarBackground": c("surface-1"),

    // Peek view
    "peekView.border": c("oxford"),
    "peekViewEditor.background": c("paper-raised"),
    "peekViewEditorGutter.background": c("paper-raised"),
    "peekViewEditor.matchHighlightBackground": fill("fill-match", "match in the peek view"),
    "peekViewResult.background": c("surface-1"),
    "peekViewResult.fileForeground": c("ink"),
    "peekViewResult.lineForeground": c("ink-2"),
    "peekViewResult.matchHighlightBackground": fill("fill-match", "match in the peek result list"),
    "peekViewResult.selectionBackground": c("surface-2"),
    "peekViewResult.selectionForeground": c("ink"),
    "peekViewTitle.background": c("surface-1"),
    "peekViewTitleLabel.foreground": c("ink"),
    "peekViewTitleDescription.foreground": c("ink-muted"),

    // Diff and merge
    "diffEditor.insertedLineBackground": fill("fill-add"),
    "diffEditor.removedLineBackground": fill("fill-remove"),
    "diffEditor.insertedTextBackground": fill("fill-add", "laid over the line already in fill-add, inserted text stands out one step (≈ 36%)"),
    "diffEditor.removedTextBackground": fill("fill-remove", "laid over the line already in fill-remove, removed text stands out one step (≈ 29%)"),
    "diffEditorGutter.insertedLineBackground": fill("fill-add", "gutter of inserted lines"),
    "diffEditorGutter.removedLineBackground": fill("fill-remove", "gutter of removed lines"),
    "diffEditorOverview.insertedForeground": a("jade", 0.6, "diff overview marker"),
    "diffEditorOverview.removedForeground": a("crimson", 0.6, "diff overview marker"),
    "diffEditor.diagonalFill": a("rule", 0.4, "hatching of regions with no counterpart"),
    "diffEditor.border": c("rule"),
    "diffEditor.unchangedRegionBackground": c("surface-1"),
    "diffEditor.unchangedRegionForeground": c("ink-muted"),
    "merge.currentContentBackground": fill("fill-add", "current side of a conflict"),
    "merge.currentHeaderBackground": a("jade-bright", 0.4, "current side header: twice fill-add, as fill-change-focus doubles fill-change; translucency required"),
    "merge.incomingContentBackground": fill("fill-change", "incoming side of a conflict"),
    "merge.incomingHeaderBackground": fill("fill-change-focus", "incoming side header"),
    "merge.commonContentBackground": a("rule", 0.2, "common ancestor, neutral; translucency required"),
    "merge.commonHeaderBackground": a("rule", 0.4, "common ancestor header; translucency required"),
    "mergeEditor.change.background": fill("fill-change", "change in the merge editor"),
    "mergeEditor.change.word.background": fill("fill-change-focus", "changed word in the merge editor"),

    // Git decorations
    "gitDecoration.addedResourceForeground": c("jade"),
    "gitDecoration.untrackedResourceForeground": c("jade"),
    "gitDecoration.modifiedResourceForeground": c("oxford"),
    "gitDecoration.stageModifiedResourceForeground": c("oxford"),
    "gitDecoration.renamedResourceForeground": c("oxford"),
    "gitDecoration.deletedResourceForeground": c("crimson"),
    "gitDecoration.stageDeletedResourceForeground": c("crimson"),
    "gitDecoration.conflictingResourceForeground": c("mandarin"),
    "gitDecoration.ignoredResourceForeground": c("ink-muted"),
    "gitDecoration.submoduleResourceForeground": c("velvet"),

    // Status bar
    "statusBar.background": c("surface-1"),
    "statusBar.foreground": c("ink-2"),
    "statusBar.border": c("rule"),
    "statusBar.noFolderBackground": c("surface-1"),
    "statusBar.noFolderForeground": c("ink-2"),
    "statusBar.debuggingBackground": c("mandarin"),
    "statusBar.debuggingForeground": c("paper"),
    "statusBarItem.hoverBackground": c("surface-3"),
    "statusBarItem.activeBackground": c("surface-3"),
    "statusBarItem.remoteBackground": c("oxford"),
    "statusBarItem.remoteForeground": c("paper"),
    "statusBarItem.errorBackground": c("crimson"),
    "statusBarItem.errorForeground": c("paper"),
    "statusBarItem.warningBackground": c("mandarin"),
    "statusBarItem.warningForeground": c("paper"),
    "statusBarItem.prominentBackground": c("surface-3"),
    "statusBarItem.prominentForeground": c("ink"),

    // Panel and terminal
    "panel.background": c("paper"),
    "panel.border": c("rule"),
    "panelTitle.activeForeground": c("ink"),
    "panelTitle.inactiveForeground": c("ink-muted"),
    "panelTitle.activeBorder": c("oxford"),
    "panelSection.dropBackground": fill("fill-change", "drop target, translucency required"),
    "terminal.background": c("paper"),
    "terminal.foreground": c("ink"),
    "terminal.border": c("rule"),
    "terminal.selectionBackground": c("surface-2"),
    "terminal.findMatchBackground": fill("fill-target", "current match in the terminal"),
    "terminal.findMatchHighlightBackground": fill("fill-match", "other matches in the terminal"),
    "terminal.dropBackground": fill("fill-change", "drop target, translucency required"),
    "terminalCursor.foreground": c("claret"),
    "terminalCursor.background": c("paper"),

    // Inputs, buttons, badges
    "input.background": c("paper-raised"),
    "input.foreground": c("ink"),
    "input.border": c("rule"),
    "input.placeholderForeground": c("ink-muted"),
    "inputOption.activeBorder": c("oxford"),
    "inputOption.activeBackground": c("surface-3"),
    "inputOption.activeForeground": c("ink"),
    "inputValidation.errorBackground": c("paper-raised"),
    "inputValidation.errorBorder": c("crimson"),
    "inputValidation.warningBackground": c("paper-raised"),
    "inputValidation.warningBorder": c("mandarin"),
    "inputValidation.infoBackground": c("paper-raised"),
    "inputValidation.infoBorder": c("oxford"),
    "dropdown.background": c("paper-raised"),
    "dropdown.listBackground": c("paper-raised"),
    "dropdown.foreground": c("ink"),
    "dropdown.border": c("rule"),
    "checkbox.background": c("paper-raised"),
    "checkbox.border": c("rule"),
    "checkbox.foreground": c("ink"),
    "button.background": c("oxford"),
    "button.foreground": c("paper"),
    "button.hoverBackground": c("oxford-bright"),
    "button.secondaryBackground": c("surface-2"),
    "button.secondaryForeground": c("ink"),
    "button.secondaryHoverBackground": c("surface-3"),
    "badge.background": c("oxford"),
    "badge.foreground": c("paper"),
    "progressBar.background": c("oxford"),
    "keybindingLabel.background": c("surface-2"),
    "keybindingLabel.foreground": c("ink"),
    "keybindingLabel.border": c("rule"),
    "keybindingLabel.bottomBorder": c("rule"),

    // Menus, command palette, notifications
    "menu.background": c("paper-raised"),
    "menu.foreground": c("ink"),
    "menu.selectionBackground": c("surface-2"),
    "menu.selectionForeground": c("ink"),
    "menu.separatorBackground": c("rule"),
    "menu.border": c("rule"),
    "menubar.selectionBackground": c("surface-2"),
    "menubar.selectionForeground": c("ink"),
    "quickInput.background": c("paper-raised"),
    "quickInput.foreground": c("ink"),
    "quickInputTitle.background": c("surface-1"),
    "quickInputList.focusBackground": c("surface-2"),
    "quickInputList.focusForeground": c("ink"),
    "pickerGroup.foreground": c("oxford"),
    "pickerGroup.border": c("rule"),
    "notifications.background": c("paper-raised"),
    "notifications.foreground": c("ink"),
    "notifications.border": c("rule"),
    "notificationCenterHeader.background": c("surface-1"),
    "notificationCenterHeader.foreground": c("ink-2"),
    "notificationLink.foreground": c("oxford"),
    "notificationsErrorIcon.foreground": c("crimson"),
    "notificationsWarningIcon.foreground": c("mandarin"),
    "notificationsInfoIcon.foreground": c("oxford"),

    // Debugging, testing, charts
    "debugToolBar.background": c("paper-raised"),
    "debugToolBar.border": c("rule"),
    "debugIcon.breakpointForeground": c("crimson"),
    "debugIcon.startForeground": c("jade"),
    "debugIcon.stopForeground": c("crimson"),
    "debugIcon.pauseForeground": c("oxford"),
    "debugIcon.continueForeground": c("oxford"),
    "debugIcon.restartForeground": c("jade"),
    "editor.stackFrameHighlightBackground": fill("fill-match", "line where the debugger stopped"),
    "editor.focusedStackFrameHighlightBackground": fill("fill-add", "selected stack frame"),
    "testing.iconPassed": c("jade"),
    "testing.iconFailed": c("crimson"),
    "testing.iconErrored": c("crimson"),
    "testing.iconQueued": c("mandarin"),
    "testing.iconSkipped": c("ink-muted"),
    "testing.iconUnset": c("ink-muted"),
    "charts.foreground": c("ink"),
    "charts.lines": c("rule"),
    "charts.red": c("crimson"),
    "charts.blue": c("oxford"),
    "charts.yellow": c("mandarin"),
    "charts.orange": c("mandarin-bright"),
    "charts.green": c("jade"),
    "charts.purple": c("velvet"),

    // Settings
    "settings.headerForeground": c("ink"),
    "settings.modifiedItemIndicator": c("oxford"),
    "settings.focusedRowBackground": c("paper-raised"),
    "settings.rowHoverBackground": c("paper-raised"),

    // Symbol icons (suggestions, outline, breadcrumbs): same roles as the syntax
    ...Object.fromEntries(
      Object.entries({
        teal: ["class", "enumerator", "interface", "struct", "typeParameter", "namespace", "module", "package"],
        oxford: ["function", "method", "constructor", "event"],
        "ink-2": ["variable", "field", "property", "key", "object", "array", "reference", "operator"],
        mandarin: ["constant", "enumeratorMember", "number", "boolean", "null", "unit", "color"],
        velvet: ["keyword"],
        jade: ["string"],
        "ink-muted": ["text", "snippet", "file", "folder"],
      }).flatMap(([role, kinds]) => kinds.map((k) => [`symbolIcon.${k}Foreground`, c(role)]))
    ),

    // Problems, light bulb, diagnostic navigation
    "problemsErrorIcon.foreground": c("crimson"),
    "problemsWarningIcon.foreground": c("mandarin"),
    "problemsInfoIcon.foreground": c("oxford"),
    "editorLightBulb.foreground": c("mandarin"),
    "editorLightBulbAutoFix.foreground": c("oxford"),
    "editorLightBulbAi.foreground": c("velvet"),
    "editorMarkerNavigation.background": c("paper-raised"),
    "editorMarkerNavigationError.background": c("crimson"),
    "editorMarkerNavigationWarning.background": c("mandarin"),
    "editorMarkerNavigationInfo.background": c("oxford"),
    "editorMarkerNavigationError.headerBackground": fill("fill-remove", "header of the error being viewed"),
    "editorMarkerNavigationWarning.headerBackground": fill("fill-match", "header of the warning being viewed"),
    "editorMarkerNavigationInfo.headerBackground": fill("fill-change", "header of the info being viewed"),
    "editorHoverWidget.highlightForeground": c("claret"),

    // Other editor highlights
    "editor.linkedEditingBackground": fill("fill-change", "tags renamed together"),
    "editor.snippetTabstopHighlightBackground": a("rule", 0.25, "snippet field, text must stay readable"),
    "editor.snippetFinalTabstopHighlightBorder": c("oxford"),
    "editorUnicodeHighlight.border": c("mandarin"),
    "editorOverviewRuler.bracketMatchForeground": c("claret"),
    "editorGutter.commentRangeForeground": c("surface-3"),
    "editorGutter.commentGlyphForeground": c("ink-2"),
    "editorGutter.commentUnresolvedGlyphForeground": c("ink-2"),
    "toolbar.hoverBackground": c("surface-2"),
    "toolbar.activeBackground": c("surface-3"),

    // Terminal: command decorations, sticky scroll
    "terminal.inactiveSelectionBackground": a("rule", 0.3, "selection in an unfocused terminal"),
    "terminal.hoverHighlightBackground": a("rule", 0.2, "hovered link in the terminal"),
    "terminalCommandDecoration.defaultBackground": c("rule"),
    "terminalCommandDecoration.successBackground": c("jade"),
    "terminalCommandDecoration.errorBackground": c("crimson"),
    "terminalOverviewRuler.cursorForeground": c("ink-2"),
    "terminalOverviewRuler.findMatchForeground": a("mandarin-bright", 0.7, "match marker, fill-match hue"),
    "terminalStickyScroll.background": c("paper"),
    "terminalStickyScrollHover.background": c("surface-1"),

    // Debugging (continued)
    "debugIcon.breakpointDisabledForeground": c("ink-faint"),
    "debugIcon.breakpointUnverifiedForeground": c("warm-grey"),
    "debugIcon.breakpointCurrentStackframeForeground": c("mandarin"),
    "debugIcon.breakpointStackframeForeground": c("jade"),
    "debugIcon.disconnectForeground": c("crimson"),
    "debugIcon.stepOverForeground": c("oxford"),
    "debugIcon.stepIntoForeground": c("oxford"),
    "debugIcon.stepOutForeground": c("oxford"),
    "debugIcon.stepBackForeground": c("oxford"),
    "debugConsole.infoForeground": c("oxford"),
    "debugConsole.warningForeground": c("mandarin"),
    "debugConsole.errorForeground": c("crimson"),
    "debugConsole.sourceForeground": c("ink-muted"),
    "debugConsoleInputIcon.foreground": c("oxford"),
    "debugTokenExpression.name": c("velvet"),
    "debugTokenExpression.value": c("ink"),
    "debugTokenExpression.string": c("jade"),
    "debugTokenExpression.boolean": c("mandarin"),
    "debugTokenExpression.number": c("mandarin"),
    "debugTokenExpression.error": c("crimson"),
    "debugTokenExpression.type": c("velvet"),
    "testing.runAction": c("jade"),

    // Extensions
    "extensionButton.prominentBackground": c("oxford"),
    "extensionButton.prominentForeground": c("paper"),
    "extensionButton.prominentHoverBackground": c("oxford-bright"),
    "extensionButton.background": c("oxford"),
    "extensionButton.foreground": c("paper"),
    "extensionButton.hoverBackground": c("oxford-bright"),
    "extensionIcon.starForeground": c("mandarin"),
    "extensionIcon.verifiedForeground": c("oxford"),
    "extensionIcon.preReleaseForeground": c("velvet"),
    "extensionIcon.sponsorForeground": c("claret"),

    // Git history graph
    "scmGraph.foreground1": c("oxford"),
    "scmGraph.foreground2": c("jade"),
    "scmGraph.foreground3": c("mandarin"),
    "scmGraph.foreground4": c("velvet"),
    "scmGraph.foreground5": c("teal"),
    "scmGraph.historyItemRefColor": c("oxford"),
    "scmGraph.historyItemRemoteRefColor": c("velvet"),
    "scmGraph.historyItemBaseRefColor": c("mandarin"),
    "scmGraph.historyItemHoverAdditionsForeground": c("jade"),
    "scmGraph.historyItemHoverDeletionsForeground": c("crimson"),
    "scmGraph.historyItemHoverLabelForeground": c("paper"),
    "scmGraph.historyItemHoverDefaultLabelForeground": c("ink"),
    "scmGraph.historyItemHoverDefaultLabelBackground": c("surface-2"),
  }

  if (type === "dark") {
    ui["terminal.selectionForeground"] = terminal.selectionForeground.hex.toLowerCase()
    // vs-dark selections retain syntax colors; selectionForeground is HC-only.
    ui["editor.selectionBackground"] = a("surface-2", 0.65, "editor selection, balances syntax contrast with visibility through published fills")
    ui["editor.selectionHighlightBorder"] = c("oxford")
    ui["editor.findMatchForeground"] = c("ink")
    ui["editor.findMatchHighlightForeground"] = c("ink")
    ui["list.filterMatchBackground"] = fill("fill-match", "retain claret contrast in selected lists", 0.06)
    // These decorations do not replace syntax foregrounds, even when selected.
    ui["searchEditor.findMatchBackground"] = fill("fill-match", "retain selected syntax contrast in search results", 0.06)
    ui["peekViewEditor.matchHighlightBackground"] = fill("fill-match", "retain selected syntax contrast in peek code", 0.06)
    ui["editor.stackFrameHighlightBackground"] = fill("fill-match", "retain selected syntax contrast on the stopped line", 0.06)
    ui["editor.focusedStackFrameHighlightBackground"] = fill("fill-add", "retain selected syntax contrast on the focused frame", 0.08)
    // Lines/content keep published fills. Extra layers stay readable without selection;
    // selected diff/merge syntax has an explicit 3:1 exception in the check.
    ui["diffEditor.insertedTextBackground"] = fill("fill-add", "word highlight over the published added line", 0.08)
    ui["merge.currentHeaderBackground"] = fill("fill-add", "header over the published current content", 0.08)
    ui["merge.commonHeaderBackground"] = a("rule", 0.3, "ancestor header over common content, keeps unselected syntax readable")
    // 20% over the existing 20% reproduces the published 36% change-focus fill.
    ui["merge.incomingHeaderBackground"] = fill("fill-change-focus", "header over incoming content", 0.2)
    ui["mergeEditor.change.word.background"] = fill("fill-change-focus", "changed word over the changed line", 0.2)
    ui["diffEditor.insertedTextBorder"] = c("jade")
    ui["diffEditor.removedTextBorder"] = c("crimson")
  }

  // Integrated terminal: use the published terminal fields and ANSI slots.
  const terminalKeys = {
    background: "terminal.background", foreground: "terminal.foreground",
    cursor: "terminalCursor.foreground", cursorText: "terminalCursor.background",
    cursorBar: "editorCursor.foreground", selectionBackground: "terminal.selectionBackground",
  }
  for (const [field, key] of Object.entries(terminalKeys)) ui[key] = terminal[field].hex.toLowerCase()
  for (const [slot, ansiName] of ansiNames.entries()) {
    const entry = terminal.ansi.find((entry) => entry.index === slot)
    if (!entry) throw new Error(`ANSI slot ${slot} missing from the palette`)
    ui[`terminal.ansi${ansiName}`] = entry.hex.toLowerCase()
  }

  // ---------------------------------------------------------------- TextMate syntax

  const tm = (name, scope, role, fontStyle) => ({
    name,
    scope,
    settings: { ...(role && { foreground: c(role) }), ...(fontStyle !== undefined && { fontStyle }) },
  })

  const tokenColors = [
    tm("Comment", ["comment", "punctuation.definition.comment"], "ink-muted", "italic"),
    tm("Documentation comment tag", ["comment.block.documentation storage.type", "comment.block.documentation entity.name.type", "storage.type.class.jsdoc"], "ink-muted", "bold italic"),
    tm("String", ["string", "punctuation.definition.string", "string.quoted.docstring"], "jade"),
    tm("Escape, interpolation", ["constant.character.escape", "constant.other.placeholder", "punctuation.definition.template-expression", "punctuation.section.embedded"], "claret"),
    tm("Regular expression", ["string.regexp"], "crimson"),
    tm("Number, boolean", ["constant.numeric", "constant.language", "keyword.other.unit"], "mandarin"),
    tm("Named constant", ["support.constant", "constant.other.color", "constant.other.enum", "variable.other.enummember", "variable.other.constant"], "claret"),
    tm("Variable", ["variable", "variable.other", "variable.other.readwrite"], "ink"),
    tm("Parameter", ["variable.parameter", "meta.parameter"], "ink-2"),
    tm("Property, key", ["variable.other.property", "variable.other.object.property", "support.variable.property", "meta.object-literal.key", "support.type.property-name", "entity.name.tag.yaml", "entity.name.tag.toml"], "claret"),
    tm("Language variable (this, self)", ["variable.language", "support.variable.dom"], "claret"),
    tm("Function", ["entity.name.function", "meta.function-call entity.name.function", "support.function", "entity.name.method"], "velvet"),
    tm("Built-in function", ["support.function.builtin", "support.function.magic", "support.function.console"], "velvet", "italic"),
    tm("Keyword", ["keyword", "keyword.control", "storage.type", "storage.modifier", "keyword.other", "keyword.operator.new", "keyword.operator.expression", "keyword.operator.word", "keyword.operator.logical.python", "entity.name.label", "keyword.control.import", "keyword.control.export", "keyword.control.from", "keyword.control.as", "keyword.other.import", "keyword.other.use"], "oxford"),
    tm("Directive, macro", ["keyword.control.directive", "meta.preprocessor", "entity.name.function.preprocessor", "entity.name.function.macro", "support.function.macro"], "claret"),
    tm("Exception", ["keyword.control.exception", "keyword.control.trycatch", "keyword.control.throw"], "crimson"),
    tm("Operator", ["keyword.operator"], "teal"),
    tm("Type, class, module", ["entity.name.type", "entity.name.class", "entity.name.namespace", "entity.name.module", "entity.other.inherited-class", "support.type", "support.class", "entity.name.type.module", "storage.type.primitive"], "velvet"),
    tm("Built-in type", ["support.type.primitive", "support.type.builtin", "support.class.builtin"], "velvet", "italic"),
    tm("Attribute, decorator", ["meta.decorator", "entity.name.function.decorator", "punctuation.decorator", "storage.type.annotation", "meta.attribute", "entity.name.function.attribute"], "claret"),
    tm("Punctuation", ["punctuation", "meta.brace", "punctuation.separator", "punctuation.terminator", "punctuation.accessor"], "ink-2"),
    tm("Tag", ["entity.name.tag", "support.class.component"], "claret"),
    tm("Tag attribute", ["entity.other.attribute-name"], "jade"),
    tm("Tag delimiter", ["punctuation.definition.tag"], "ink-2"),
    tm("Invalid", ["invalid", "invalid.illegal"], "crimson"),
    tm("Deprecated", ["invalid.deprecated"], "mandarin", "strikethrough"),

    // Markdown
    tm("Heading", ["markup.heading", "heading.1.markdown", "heading.2.markdown", "heading.1.markdown entity.name.section", "heading.2.markdown entity.name.section"], "claret", "bold"),
    tm("Heading 3", ["heading.3.markdown", "heading.3.markdown entity.name.section"], "oxford", "bold"),
    tm("Heading 4", ["heading.4.markdown", "heading.4.markdown entity.name.section"], "oxford", ""),
    tm("Headings 5 and 6", ["heading.5.markdown", "heading.6.markdown", "heading.5.markdown entity.name.section", "heading.6.markdown entity.name.section"], "teal", ""),
    tm("Bold", ["markup.bold"], "ink", "bold"),
    tm("Italic", ["markup.italic"], null, "italic"),
    tm("Strikethrough", ["markup.strikethrough"], null, "strikethrough"),
    tm("Link", ["markup.underline.link", "markup.link", "string.other.link", "meta.link.inline.markdown", "constant.other.reference.link"], "oxford"),
    tm("URL", ["markup.underline.link"], "oxford", "underline"),
    tm("Inline code", ["markup.inline.raw", "markup.inline.raw.string.markdown", "markup.fenced_code.block.markdown", "markup.raw"], "ink-2"),
    tm("Quote", ["markup.quote"], "ink-2", "italic"),
    tm("List bullet", ["punctuation.definition.list.begin.markdown", "beginning.punctuation.definition.list.markdown", "punctuation.definition.list"], "claret"),
    tm("Diff inserted", ["markup.inserted", "punctuation.definition.inserted"], "jade"),
    tm("Diff deleted", ["markup.deleted", "punctuation.definition.deleted"], "claret"),
    tm("Diff changed", ["markup.changed", "punctuation.definition.changed"], "oxford"),
    tm("Diff header", ["meta.diff.header", "meta.diff.range", "meta.diff.index"], "ink-muted"),
    tm("Diff file", ["meta.diff.header.from-file", "meta.diff.header.to-file"], "ink", "bold"),
  ]

  // ---------------------------------------------------------------- semantic syntax
  // Same roles as above, for language servers that emit semantic tokens.

  const st = (role, fontStyle) => (fontStyle === undefined ? c(role) : { foreground: c(role), fontStyle })

  const semanticTokenColors = {
    comment: st("ink-muted", "italic"),
    string: st("jade"),
    regexp: st("crimson"),
    number: st("mandarin"),
    enumMember: st("claret"),
    keyword: st("oxford"),
    label: st("oxford"),
    operator: st("teal"),
    variable: st("ink"),
    "variable.defaultLibrary": st("claret"),
    selfKeyword: st("claret"),
    parameter: st("ink-2"),
    property: st("claret"),
    function: st("velvet"),
    method: st("velvet"),
    "function.defaultLibrary": st("velvet", "italic"),
    "method.defaultLibrary": st("velvet", "italic"),
    macro: st("claret"),
    decorator: st("claret"),
    namespace: st("velvet"),
    type: st("velvet"),
    class: st("velvet"),
    enum: st("velvet"),
    interface: st("velvet"),
    struct: st("velvet"),
    typeParameter: st("velvet"),
    "type.defaultLibrary": st("velvet", "italic"),
    "class.defaultLibrary": st("velvet", "italic"),
    "*.deprecated": { fontStyle: "strikethrough" },
  }

  // ---------------------------------------------------------------- assembly

  const colors = {}
  const alphaReasons = {}
  for (const [key, value] of Object.entries(ui)) {
    if (typeof value === "string") colors[key] = value
    else {
      colors[key] = value.hex
      alphaReasons[key] = value.why
    }
  }
  return {
    theme: {
      $schema: "vscode://schemas/color-theme",
      name,
      type,
      semanticHighlighting: true,
      colors,
      tokenColors,
      semanticTokenColors,
    },
    alphaReasons,
  }
}
