import XCTest
@testable import Passage

@MainActor
final class ItineraryStateTests: XCTestCase {
    func testReorderPreservesTimesAndMakesConflictsVisible() {
        let store = ItineraryStore(fileURL: nil)
        XCTAssertTrue(store.itinerary.conflictingIDs.isEmpty)
        store.move(from: IndexSet(integer: 0), to: 2)
        XCTAssertEqual(store.itinerary.stops[1].id, "morning")
        XCTAssertEqual(store.itinerary.stops[1].startMinutes, 570)
        XCTAssertEqual(store.itinerary.conflictingIDs, Set(["morning", "print"]))
        XCTAssertFalse(store.itinerary.conflictNotes(for: "morning").isEmpty)
        store.undo(); XCTAssertEqual(store.itinerary, .sample)
    }
    func testTimeEditValidationAndUndo() {
        let store = ItineraryStore(fileURL: nil)
        store.updateTime(id: "morning", minutes: 585)
        XCTAssertEqual(store.itinerary.stops[0].clock, "09:45")
        store.updateTime(id: "morning", minutes: 1439)
        XCTAssertEqual(store.itinerary.stops[0].startMinutes, 585)
        store.undo(); XCTAssertEqual(store.itinerary, .sample)
        store.updateTime(id: "print", minutes: 580)
        XCTAssertEqual(store.itinerary.conflictingIDs, Set(["morning", "print"]))
    }
    func testPersistenceAndFailureKeepStateHonest() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("plan.json")
        let store = ItineraryStore(fileURL: url); store.updateTime(id: "water", minutes: 800)
        XCTAssertEqual(ItineraryStore(fileURL: url).itinerary, store.itinerary)
        let invalidPath = url.appendingPathComponent("plan.json")
        let blocked = ItineraryStore(fileURL: invalidPath); blocked.updateTime(id: "morning", minutes: 600)
        XCTAssertTrue(blocked.unsaved); XCTAssertNotNil(blocked.errorMessage)
        XCTAssertEqual(blocked.itinerary.stops[0].clock, "10:00")
    }
    func testBackupFailureCanRetryWithoutLosingTheOriginal() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer {
            try? FileManager.default.setAttributes([.posixPermissions: 0o700], ofItemAtPath: directory.path)
            try? FileManager.default.removeItem(at: directory)
        }
        let url = directory.appendingPathComponent("plan.json")
        let original = Data("Unreadable study data".utf8)
        try original.write(to: url)
        try FileManager.default.setAttributes([.posixPermissions: 0o500], ofItemAtPath: directory.path)
        let store = ItineraryStore(fileURL: url)
        store.updateTime(id: "morning", minutes: 600)
        XCTAssertTrue(store.unsaved)
        XCTAssertEqual(try Data(contentsOf: url), original)
        try FileManager.default.setAttributes([.posixPermissions: 0o700], ofItemAtPath: directory.path)
        store.persist()
        XCTAssertFalse(store.unsaved); XCTAssertNil(store.errorMessage)
        XCTAssertEqual(ItineraryStore(fileURL: url).itinerary, store.itinerary)
        let backup = try XCTUnwrap(FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil).first { $0.lastPathComponent.contains("unreadable-") })
        XCTAssertEqual(try Data(contentsOf: backup), original)
    }

}
