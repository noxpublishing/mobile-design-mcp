import Foundation
import Combine

@MainActor
final class PaletteStore: ObservableObject {
    @Published private(set) var composition: Composition
    @Published private(set) var history: [Composition] = []
    @Published private(set) var unsaved = false
    @Published var errorMessage: String?
    private let fileURL: URL?

    init(fileURL: URL? = PaletteStore.defaultURL) {
        self.fileURL = fileURL
        composition = .sample
        guard let fileURL, FileManager.default.fileExists(atPath: fileURL.path) else { return }
        do {
            let data = try Data(contentsOf: fileURL)
            let saved = try JSONDecoder().decode(Composition.self, from: data)
            guard saved.valid else { throw CocoaError(.fileReadCorruptFile) }
            composition = saved
        } catch {
            let backup = fileURL.appendingPathExtension("unreadable-" + UUID().uuidString)
            do {
                try FileManager.default.copyItem(at: fileURL, to: backup)
                errorMessage = "The saved palette could not be read. A recovery copy was kept; the built-in palette is shown."
            } catch {
                errorMessage = "The saved palette could not be read or backed up. Changes stay in this session; the saved file is preserved."
                persistenceBlocked = true
            }
        }
    }

    private var persistenceBlocked = false
    nonisolated static var defaultURL: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Palette/composition.json")
    }

    func update(_ swatch: Swatch) {
        guard swatch.valid, let index = composition.swatches.firstIndex(where: { $0.id == swatch.id }) else { return }
        var next = composition; next.swatches[index] = swatch; commit(next)
    }

    func move(from offsets: IndexSet, to destination: Int) {
        guard (0...composition.swatches.count).contains(destination), offsets.allSatisfy({ composition.swatches.indices.contains($0) }) else { return }
        var next = composition
        let moving = offsets.sorted().map { next.swatches[$0] }
        for index in offsets.sorted(by: >) { next.swatches.remove(at: index) }
        let adjusted = destination - offsets.filter { $0 < destination }.count
        next.swatches.insert(contentsOf: moving, at: adjusted)
        commit(next)
    }

    func undo() {
        guard let previous = history.popLast() else { return }
        composition = previous; persist()
    }

    private func commit(_ next: Composition) {
        guard next.valid, next != composition else { return }
        history.append(composition)
        if history.count > 20 { history.removeFirst() }
        composition = next; persist()
    }

    func persist() {
        guard let fileURL else { unsaved = false; return }
        do {
            if persistenceBlocked {
                try FileManager.default.copyItem(at: fileURL, to: fileURL.appendingPathExtension("unreadable-" + UUID().uuidString))
                persistenceBlocked = false
            }
            try FileManager.default.createDirectory(at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
            try JSONEncoder().encode(composition).write(to: fileURL, options: .atomic)
            unsaved = false; errorMessage = nil
        } catch { unsaved = true; errorMessage = "Changes are kept in this session, but could not be saved. Try saving again." }
    }
}
