import SwiftUI

struct ItineraryView: View {
    @ObservedObject var store: ItineraryStore
    @Environment(\.accessibilityReduceMotion) private var reducedMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var selected: Stop?
    @State private var refined = true

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 14) {
                        Text(refined ? "An unhurried\nSaturday." : "My day plan")
                            .font(refined ? .system(.largeTitle, design: .serif) : .largeTitle).accessibilityAddTraits(.isHeader)
                        Text("Four stops, with room in between.").font(.subheadline).foregroundStyle(.secondary)
                        if refined { RouteSketch(stops: store.itinerary.stops).frame(height: 142).clipShape(RoundedRectangle(cornerRadius: 20)).padding(.vertical, 8) }
                        Text("Fictional plan · original route sketch").font(.caption).foregroundStyle(.secondary)
                    }.padding(.vertical, 8)
                }.listRowBackground(Color.clear).listRowSeparator(.hidden)
                if !store.itinerary.conflictingIDs.isEmpty {
                    Section {
                        Label("\(store.itinerary.conflictingIDs.count) stops need a time review", systemImage: "exclamationmark.triangle")
                            .foregroundStyle(.red).accessibilityIdentifier("schedule-conflict")
                        Text("Review neighbouring times, or undo the change.").font(.footnote)
                    }
                }
                Section {
                    ForEach(store.itinerary.stops) { stop in
                        stopRow(stop)
                    }.onMove { offsets, destination in store.move(from: offsets, to: destination) }
                } header: { Text("Your day · drag to reorder") } footer: { Text("Tap a stop to edit its time. Reordering keeps entered times, so conflicts stay visible.") }
                if store.unsaved { Section { Button("Retry saving") { store.persist() } } }
            }
            .listStyle(.insetGrouped).scrollContentBackground(.hidden).background(PassageTheme.background)
            .environment(\.editMode, .constant(.active))
            .navigationTitle("Passage").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { store.undo() } label: { Image(systemName: "arrow.uturn.backward") }
                        .disabled(store.history.isEmpty).accessibilityLabel("Undo change").accessibilityIdentifier("undo-plan")
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("Refined treatment") { refined = true }
                        Button("Baseline treatment") { refined = false }
                    } label: { Image(systemName: "slider.horizontal.3") }
                    .accessibilityLabel("Study treatment").accessibilityIdentifier("study-treatment")
                }
            }
            .sheet(item: $selected) { stop in
                StopDetail(stop: stop, itinerary: store.itinerary, onSave: {
                    store.updateTime(id: stop.id, minutes: $0); selected = nil
                }, onCancel: { selected = nil })
            }
            .alert("Passage", isPresented: Binding(get: { store.errorMessage != nil }, set: { if !$0 { store.errorMessage = nil } })) {
                Button("OK") { store.errorMessage = nil }
            } message: { Text(store.errorMessage ?? "") }
            .animation(reducedMotion ? nil : .easeInOut(duration: 0.24), value: store.itinerary)
            .tint(PassageTheme.accent)
        }
    }
    private func stopRow(_ stop: Stop) -> some View {
        let layout = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 8)) : AnyLayout(HStackLayout(alignment: .top, spacing: 16))
        return Button { selected = stop } label: {
            layout {
                Text(stop.clock).font(.system(.headline, design: .monospaced)).foregroundStyle(PassageTheme.accent)
                VStack(alignment: .leading, spacing: 6) {
                    Text(stop.title).font(.headline).foregroundStyle(.primary)
                    Text(stop.kind).font(.subheadline).foregroundStyle(.secondary)
                    Text("\(stop.durationMinutes) min").font(.caption).foregroundStyle(.secondary)
                    if store.itinerary.conflictingIDs.contains(stop.id) { Label("Time conflict", systemImage: "exclamationmark.triangle").font(.caption).foregroundStyle(.red) }
                }.frame(maxWidth: .infinity, alignment: .leading)
            }.padding(.vertical, 12).contentShape(Rectangle())
        }.buttonStyle(.plain).accessibilityLabel("Open " + stop.title)
            .accessibilityValue(stop.clock + (store.itinerary.conflictingIDs.contains(stop.id) ? ", time conflict" : ""))
            .accessibilityIdentifier("stop-" + stop.id)
            .accessibilityAction(named: "Move earlier") { move(stop, delta: -1) }
            .accessibilityAction(named: "Move later") { move(stop, delta: 1) }
    }
    private func move(_ stop: Stop, delta: Int) {
        guard let index = store.itinerary.stops.firstIndex(where: { $0.id == stop.id }), store.itinerary.stops.indices.contains(index + delta) else { return }
        store.move(from: IndexSet(integer: index), to: delta > 0 ? index + 2 : index - 1)
    }
}
