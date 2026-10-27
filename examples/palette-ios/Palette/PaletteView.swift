import SwiftUI

struct PaletteView: View {
    @ObservedObject var store: PaletteStore
    @Environment(\.accessibilityReduceMotion) private var reducedMotion
    @Namespace private var namespace
    @State private var editing: Swatch?
    @State private var refined = true
    @State private var exporting = false
    @State private var exportDocument = ExportDocument(svg: "")
    @State private var exportStatus = ""

    var body: some View {
        NavigationStack {
            ZStack {
                List {
                    Section {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(refined ? "Warm afternoon" : "My colour palette")
                                .font(refined ? .system(.largeTitle, design: .serif) : .largeTitle)
                                .accessibilityAddTraits(.isHeader)
                            Text("Five colours. Edit one, change the order, make it yours.")
                                .font(.subheadline).foregroundStyle(.secondary)
                            CompositionCanvas(composition: store.composition)
                                .frame(height: refined ? 200 : 110).clipShape(RoundedRectangle(cornerRadius: refined ? 20 : 8))
                                .padding(.top, 8)
                            HStack { Text("Composition 01"); Spacer(); Text("RGB · \(store.composition.swatches.count) colours") }
                                .font(.system(.caption, design: .monospaced)).foregroundStyle(.secondary)
                        }.padding(.vertical, 8)
                    }.listRowBackground(Color.clear).listRowSeparator(.hidden)
                    Section {
                        ForEach(store.composition.swatches) { swatch in
                            Button { editing = swatch } label: {
                                HStack(spacing: 16) {
                                    if editing?.id == swatch.id { Color.clear.frame(width: 56, height: 56) }
                                    else {
                                        RoundedRectangle(cornerRadius: refined ? 14 : 6).fill(swatch.color)
                                            .matchedGeometryEffect(id: swatch.id, in: namespace)
                                            .frame(width: 56, height: 56)
                                    }
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(swatch.name).font(.headline).foregroundStyle(.primary)
                                        Text(swatch.hex).font(.system(.caption, design: .monospaced)).foregroundStyle(.secondary)
                                    }
                                    Spacer(minLength: 0)
                                }.padding(.vertical, 3).contentShape(Rectangle())
                            }
                            .buttonStyle(.plain).accessibilityLabel("Edit " + swatch.name)
                            .accessibilityValue(swatch.hex)
                            .accessibilityIdentifier("swatch-" + swatch.id)
                            .accessibilityAction(named: "Move earlier") { move(swatch, delta: -1) }
                            .accessibilityAction(named: "Move later") { move(swatch, delta: 1) }
                            .listRowBackground(refined ? PaletteTheme.card : Color(uiColor: .secondarySystemGroupedBackground))
                        }.onMove { offsets, destination in store.move(from: offsets, to: destination) }
                    } header: { Text("Your palette · drag to reorder") }
                    if store.unsaved {
                        Section { Button("Retry saving") { store.persist() }.accessibilityIdentifier("retry-save") }
                    }
                    Section {
                        Button {
                            exportDocument = ExportDocument(svg: store.composition.svg)
                            exporting = true; exportStatus = "Choose a destination for the SVG."
                        } label: {
                            HStack { Image(systemName: "square.and.arrow.up"); Text("Export composition").fontWeight(.semibold); Spacer(); Image(systemName: "arrow.up.right") }
                                .frame(minHeight: 44)
                        }.accessibilityIdentifier("export-composition")
                        if !exportStatus.isEmpty { Text(exportStatus).font(.footnote).accessibilityIdentifier("export-status") }
                    } footer: { Text("Original colour study · SVG artwork 1000 × 600 · No account needed") }
                }
                .listStyle(.insetGrouped).scrollContentBackground(.hidden)
                .environment(\.editMode, .constant(.active))
                .accessibilityHidden(editing != nil).allowsHitTesting(editing == nil)
                if let editing {
                    SwatchEditor(swatch: editing, namespace: namespace, onSave: { store.update($0); self.editing = nil }, onCancel: { self.editing = nil })
                        .transition(.opacity).zIndex(1)
                }
            }
            .background(PaletteTheme.paper)
            .navigationTitle("Palette").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if editing == nil {
                    ToolbarItem(placement: .topBarLeading) {
                        Button { store.undo() } label: { Image(systemName: "arrow.uturn.backward") }
                            .disabled(store.history.isEmpty).accessibilityLabel("Undo change").accessibilityIdentifier("undo-change")
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu {
                            Button("Refined treatment") { refined = true }
                            Button("Baseline treatment") { refined = false }
                        } label: { Image(systemName: "slider.horizontal.3") }
                        .accessibilityLabel("Study treatment").accessibilityIdentifier("study-treatment")
                    }
                }
            }
            .fileExporter(isPresented: $exporting, document: exportDocument, contentTypes: [.svg], defaultFilename: "Palette") { result in
                switch result {
                case .success: exportStatus = "Composition exported."
                case .failure(let error):
                    if (error as NSError).domain == NSCocoaErrorDomain && (error as NSError).code == CocoaError.userCancelled.rawValue {
                        exportStatus = "Export cancelled."
                    } else { store.errorMessage = "The export could not be completed: " + error.localizedDescription }
                }
            } onCancellation: {
                exportStatus = "Export cancelled."
            }
            .alert("Palette", isPresented: Binding(get: { store.errorMessage != nil }, set: { if !$0 { store.errorMessage = nil } })) {
                Button("OK") { store.errorMessage = nil }
            } message: { Text(store.errorMessage ?? "") }
            .animation(reducedMotion ? nil : .spring(response: 0.4, dampingFraction: 0.88), value: editing?.id)
            .animation(reducedMotion ? nil : .easeInOut(duration: 0.22), value: store.composition)
            .tint(PaletteTheme.accent)
        }
    }

    private func move(_ swatch: Swatch, delta: Int) {
        guard let index = store.composition.swatches.firstIndex(where: { $0.id == swatch.id }), store.composition.swatches.indices.contains(index + delta) else { return }
        store.move(from: IndexSet(integer: index), to: delta > 0 ? index + 2 : index - 1)
    }
}
