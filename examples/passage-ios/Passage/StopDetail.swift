import SwiftUI

struct StopDetail: View {
    @State private var draft: Stop
    let itinerary: Itinerary
    let onSave: (Int) -> Void
    let onCancel: () -> Void
    init(stop: Stop, itinerary: Itinerary, onSave: @escaping (Int) -> Void, onCancel: @escaping () -> Void) {
        _draft = State(initialValue: stop); self.itinerary = itinerary; self.onSave = onSave; self.onCancel = onCancel
    }
    private var notes: [String] {
        var preview = itinerary
        if let index = preview.stops.firstIndex(where: { $0.id == draft.id }) { preview.stops[index] = draft }
        return preview.conflictNotes(for: draft.id)
    }
    private var time: Binding<Date> {
        Binding(get: {
            Calendar.current.date(bySettingHour: draft.startMinutes / 60, minute: draft.startMinutes % 60, second: 0, of: Date()) ?? Date()
        }, set: {
            let parts = Calendar.current.dateComponents([.hour, .minute], from: $0)
            draft.startMinutes = (parts.hour ?? 0) * 60 + (parts.minute ?? 0)
        })
    }
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(draft.title).font(.system(.title2, design: .serif)).accessibilityAddTraits(.isHeader)
                    Text(draft.detail).font(.body)
                } header: { Text("Fictional study stop") }
                Section {
                    Text(draft.clock).font(.system(.largeTitle, design: .monospaced)).accessibilityIdentifier("draft-arrival")
                    HStack {
                        Button("15 min earlier") { draft.startMinutes = max(0, draft.startMinutes - 15) }
                            .accessibilityIdentifier("time-earlier").frame(minHeight: 44)
                        Spacer()
                        Button("15 min later") { draft.startMinutes = min(1439, draft.startMinutes + 15) }
                            .accessibilityIdentifier("time-later").frame(minHeight: 44)
                    }.buttonStyle(.borderless)
                    DatePicker("Arrival time", selection: time, displayedComponents: .hourAndMinute)
                        .accessibilityIdentifier("arrival-time")
                    Text("\(draft.durationMinutes) minutes at this stop. Other times stay as entered.")
                        .font(.footnote).foregroundStyle(.secondary)
                    if !draft.valid { Label("This stop would end after midnight. Choose an earlier time.", systemImage: "exclamationmark.triangle").foregroundStyle(.red) }
                } header: { Text("Arrival") }
                if !notes.isEmpty {
                    Section { ForEach(notes, id: \.self) { Text($0) } } header: { Text("Timing to review") }
                }
            }
            .navigationTitle("Stop details").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel", action: onCancel).accessibilityIdentifier("cancel-stop") }
                ToolbarItem(placement: .confirmationAction) { Button("Save time") { onSave(draft.startMinutes) }.disabled(!draft.valid).accessibilityIdentifier("save-time") }
            }.tint(PassageTheme.accent)
        }
        .presentationDetents([.medium, .large]).presentationDragIndicator(.visible)
    }
}
