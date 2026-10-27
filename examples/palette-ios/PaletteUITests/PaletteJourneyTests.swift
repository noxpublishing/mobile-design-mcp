import XCTest

final class PaletteJourneyTests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    func testEditCancelSaveUndoAndExportPresentation() {
        let app = XCUIApplication(); app.launchArguments = ["--uitesting"]; app.launch()
        XCTAssertTrue(app.buttons["swatch-clay"].waitForExistence(timeout: 10))
        let original = app.buttons["swatch-clay"].value as? String
        XCTAssertEqual(original, "#C4523B")
        capture("palette-refined")
        app.buttons["swatch-clay"].tap()
        XCTAssertTrue(app.buttons["save-colour"].waitForExistence(timeout: 3))
        capture("palette-edit")
        app.sliders["channel-red"].adjust(toNormalizedSliderPosition: 0.2)
        app.buttons["cancel-edit"].tap()
        XCTAssertFalse(app.buttons["undo-change"].isEnabled)
        XCTAssertEqual(app.buttons["swatch-clay"].value as? String, original)
        app.buttons["swatch-clay"].tap()
        app.sliders["channel-red"].adjust(toNormalizedSliderPosition: 0.3)
        app.buttons["save-colour"].tap()
        XCTAssertTrue(app.buttons["undo-change"].isEnabled)
        XCTAssertNotEqual(app.buttons["swatch-clay"].value as? String, original)
        app.buttons["undo-change"].tap()
        XCTAssertFalse(app.buttons["undo-change"].isEnabled)
        XCTAssertEqual(app.buttons["swatch-clay"].value as? String, original)
        app.swipeUp()
        app.buttons["export-composition"].tap()
        let picker = app.otherElements["Browse View (Picker)"]
        XCTAssertTrue(picker.waitForExistence(timeout: 20), app.debugDescription)
        picker.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.01)).press(forDuration: 0.1, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.95)))
        XCTAssertTrue(app.staticTexts["Export cancelled."].waitForExistence(timeout: 5))
        XCTAssertEqual(app.buttons["swatch-clay"].value as? String, original)
        app.swipeUp()
        app.buttons["export-composition"].tap()
        let save = app.buttons.matching(NSPredicate(format: "label IN %@", ["Export", "Save", "Sichern", "Exportieren", "Bewegen"])).firstMatch
        XCTAssertTrue(save.waitForExistence(timeout: 20), app.debugDescription)
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true AND hittable == true"), object: save)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 45), .completed, app.debugDescription)
        capture("palette-export-destination")
        let tree = XCTAttachment(string: app.debugDescription); tree.name = "export-destination-tree"; tree.lifetime = .keepAlways; add(tree)
        save.tap()
        let replace = app.alerts.buttons.matching(NSPredicate(format: "label IN %@", ["Replace", "Ersetzen"])).firstMatch
        if replace.waitForExistence(timeout: 2) { replace.tap() }
        XCTAssertTrue(app.staticTexts["Composition exported."].waitForExistence(timeout: 10), app.debugDescription)
        capture("palette-exported")
    }

    func testBaselineUsesTheSameEditableData() {
        let app = XCUIApplication(); app.launchArguments = ["--uitesting"]; app.launch()
        app.buttons["study-treatment"].tap(); app.buttons["Baseline treatment"].tap()
        XCTAssertTrue(app.buttons["swatch-clay"].exists)
        capture("palette-baseline")
    }

    func testTextLayoutKeepsEditingActionsReachable() {
        let app = XCUIApplication(); app.launchArguments = ["--uitesting"]; app.launch()
        let swatch = app.buttons["swatch-clay"]
        for _ in 0..<5 { if swatch.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(swatch.isHittable); capture("palette-text-layout")
        swatch.tap()
        XCTAssertTrue(app.buttons["save-colour"].waitForExistence(timeout: 5))
        app.swipeUp()
        XCTAssertTrue(app.buttons["save-colour"].isHittable)
        XCTAssertTrue(app.buttons["cancel-edit"].isHittable)
        capture("palette-text-editor")
        app.buttons["cancel-edit"].tap()
        XCTAssertFalse(app.buttons["undo-change"].isEnabled)
    }

    func testNativeReorderAndReducedMotionPath() {
        let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        settings.launch()
        let accessibility = settings.staticTexts.matching(NSPredicate(format: "label IN %@", ["Accessibility", "Bedienungshilfen"])).firstMatch
        for _ in 0..<6 { if accessibility.isHittable { break }; settings.swipeUp() }
        XCTAssertTrue(accessibility.isHittable, settings.debugDescription); accessibility.tap()
        let motion = settings.staticTexts.matching(NSPredicate(format: "label IN %@", ["Motion", "Bewegung"])).firstMatch
        XCTAssertTrue(motion.waitForExistence(timeout: 5), settings.debugDescription); motion.tap()
        let toggle = settings.switches["REDUCE_MOTION"]
        XCTAssertTrue(toggle.waitForExistence(timeout: 5), settings.debugDescription)
        let originalSetting = toggle.value as? String
        if originalSetting != "1" { toggle.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5)).tap() }
        let enabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", "1"), object: toggle)
        XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 5), .completed, settings.debugDescription)
        defer {
            settings.activate()
            if toggle.exists && toggle.value as? String != originalSetting {
                toggle.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5)).tap()
            }
        }
        let app = XCUIApplication(); app.launchArguments = ["--uitesting"]; app.launch()
        XCTAssertTrue(app.buttons["swatch-clay"].waitForExistence(timeout: 10))
        let tree = XCTAttachment(string: app.debugDescription); tree.name = "palette-reorder-tree"; tree.lifetime = .keepAlways; add(tree)
        let row = app.cells.containing(.button, identifier: "swatch-clay").firstMatch
        let start = row.coordinate(withNormalizedOffset: CGVector(dx: 0.94, dy: 0.5))
        let end = app.cells.containing(.button, identifier: "swatch-ochre").firstMatch.coordinate(withNormalizedOffset: CGVector(dx: 0.94, dy: 0.9))
        start.press(forDuration: 0.8, thenDragTo: end)
        XCTAssertTrue(app.buttons["undo-change"].isEnabled)
        app.buttons["undo-change"].tap(); XCTAssertFalse(app.buttons["undo-change"].isEnabled)
        app.buttons["swatch-clay"].tap(); XCTAssertTrue(app.buttons["save-colour"].waitForExistence(timeout: 3))
        app.buttons["cancel-edit"].tap(); XCTAssertTrue(app.buttons["swatch-clay"].exists)
        capture("palette-reduced-motion-task")
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
}
