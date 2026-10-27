import XCTest
@testable import Palette

@MainActor
final class PaletteStateTests: XCTestCase {
    func testEditMoveAndUndoPreserveIdentity() {
        let store = PaletteStore(fileURL: nil)
        let initial = store.composition
        var edited = initial.swatches[0]; edited.red = 0.1
        store.update(edited)
        XCTAssertEqual(store.composition.swatches[0].id, initial.swatches[0].id)
        store.move(from: IndexSet(integer: 0), to: 3)
        XCTAssertEqual(store.composition.swatches[2], edited)
        store.undo(); XCTAssertEqual(store.composition.swatches[0], edited)
        store.undo(); XCTAssertEqual(store.composition, initial)
    }

    func testPersistenceAndExportUseActualComposition() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("palette.json")
        let store = PaletteStore(fileURL: url)
        store.move(from: IndexSet(integer: 0), to: 5)
        XCTAssertFalse(store.unsaved)
        XCTAssertEqual(PaletteStore(fileURL: url).composition, store.composition)
        XCTAssertEqual(store.composition.svg.components(separatedBy: "<circle ").count - 1, 5)
        XCTAssertEqual(store.composition.svg.components(separatedBy: "<clipPath ").count - 1, 5)
        XCTAssertTrue(store.composition.svg.contains("viewBox=\"0 0 1000 600\""))
        XCTAssertTrue(store.composition.svg.contains(store.composition.swatches[0].hex))
        var invalid = store.composition.swatches[0]; invalid.red = .nan
        let valid = store.composition; store.update(invalid); XCTAssertEqual(store.composition, valid)
    }

    func testFailedSaveKeepsSessionStateAndReportsFailure() throws {
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try Data("Not a directory".utf8).write(to: file)
        defer { try? FileManager.default.removeItem(at: file) }
        let store = PaletteStore(fileURL: file.appendingPathComponent("palette.json"))
        store.move(from: IndexSet(integer: 0), to: 2)
        XCTAssertTrue(store.unsaved); XCTAssertNotNil(store.errorMessage)
        XCTAssertEqual(store.composition.swatches[1].id, "clay")
    }
    func testBackupFailureCanRetryWithoutLosingTheOriginal() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer {
            try? FileManager.default.setAttributes([.posixPermissions: 0o700], ofItemAtPath: directory.path)
            try? FileManager.default.removeItem(at: directory)
        }
        let url = directory.appendingPathComponent("palette.json")
        let original = Data("Unreadable study data".utf8)
        try original.write(to: url)
        try FileManager.default.setAttributes([.posixPermissions: 0o500], ofItemAtPath: directory.path)
        let store = PaletteStore(fileURL: url)
        store.move(from: IndexSet(integer: 0), to: 2)
        XCTAssertTrue(store.unsaved)
        XCTAssertEqual(try Data(contentsOf: url), original)
        try FileManager.default.setAttributes([.posixPermissions: 0o700], ofItemAtPath: directory.path)
        store.persist()
        XCTAssertFalse(store.unsaved); XCTAssertNil(store.errorMessage)
        XCTAssertEqual(PaletteStore(fileURL: url).composition, store.composition)
        let backup = try XCTUnwrap(FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil).first { $0.lastPathComponent.contains("unreadable-") })
        XCTAssertEqual(try Data(contentsOf: backup), original)
    }

}
