import SwiftUI

@main
struct PassageApp: App {
    @StateObject private var store = ItineraryStore(fileURL: ProcessInfo.processInfo.arguments.contains("--uitesting") ? nil : ItineraryStore.defaultURL)
    var body: some Scene { WindowGroup { ItineraryView(store: store) } }
}
