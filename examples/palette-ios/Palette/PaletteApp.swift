import SwiftUI

@main
struct PaletteApp: App {
    @StateObject private var store = PaletteStore(fileURL: ProcessInfo.processInfo.arguments.contains("--uitesting") ? nil : PaletteStore.defaultURL)
    var body: some Scene { WindowGroup { PaletteView(store: store) } }
}
