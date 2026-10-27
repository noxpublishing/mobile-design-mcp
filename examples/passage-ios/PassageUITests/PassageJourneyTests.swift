import XCTest

final class PassageJourneyTests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    func testTextLayoutKeepsSheetActionsReachable() {
        let app = XCUIApplication(); app.launchArguments = ["--uitesting"]; app.launch()
        let stop = app.buttons["stop-morning"]
        for _ in 0..<6 { if stop.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(stop.isHittable); capture("passage-text-layout")
        stop.tap()
        XCTAssertTrue(app.buttons["save-time"].waitForExistence(timeout: 5))
        app.swipeUp()
        XCTAssertTrue(app.buttons["save-time"].isHittable)
        XCTAssertTrue(app.buttons["cancel-stop"].isHittable)
        capture("passage-text-sheet")
        app.buttons["cancel-stop"].tap()
        XCTAssertEqual(app.buttons["stop-morning"].value as? String, "09:30")
    }
    func testEditTimeCancelSaveAndUndo() {
        let app = XCUIApplication(); app.launchArguments = ["--uitesting"]; app.launch()
        XCTAssertTrue(app.buttons["stop-morning"].waitForExistence(timeout: 10))
        capture("passage-refined")
        app.buttons["stop-morning"].tap()
        XCTAssertTrue(app.buttons["time-later"].waitForExistence(timeout: 5))
        capture("passage-time-sheet")
        app.buttons["time-later"].tap(); app.buttons["cancel-stop"].tap()
        XCTAssertEqual(app.buttons["stop-morning"].value as? String, "09:30")
        app.buttons["stop-morning"].tap(); app.buttons["time-later"].tap(); app.buttons["save-time"].tap()
        XCTAssertEqual(app.buttons["stop-morning"].value as? String, "09:45")
        app.buttons["undo-plan"].tap(); XCTAssertEqual(app.buttons["stop-morning"].value as? String, "09:30")
    }
    func testNativeReorderConflictAndRecovery() {
        let app = XCUIApplication(); app.launchArguments = ["--uitesting"]; app.launch()
        XCTAssertTrue(app.buttons["stop-morning"].waitForExistence(timeout: 10))
        let first = app.cells.containing(.button, identifier: "stop-morning").firstMatch
        let second = app.cells.containing(.button, identifier: "stop-print").firstMatch
        first.coordinate(withNormalizedOffset: CGVector(dx: 0.94, dy: 0.5)).press(forDuration: 0.8, thenDragTo: second.coordinate(withNormalizedOffset: CGVector(dx: 0.94, dy: 0.9)))
        let conflict = app.descendants(matching: .any).matching(identifier: "schedule-conflict").firstMatch
        if !conflict.exists { app.swipeDown() }
        XCTAssertTrue(conflict.waitForExistence(timeout: 5), app.debugDescription)
        capture("passage-schedule-conflict")
        app.buttons["undo-plan"].tap()
        XCTAssertFalse(app.buttons["stop-morning"].value as? String == "09:30, time conflict")
        XCTAssertFalse(app.buttons["undo-plan"].isEnabled)
        app.buttons["study-treatment"].tap(); app.buttons["Baseline treatment"].tap()
        capture("passage-baseline")
    }
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
}
