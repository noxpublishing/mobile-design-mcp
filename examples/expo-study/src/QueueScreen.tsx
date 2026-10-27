import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, AppState, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture } from 'react-native-gesture-handler';
import ReorderableList, { useReorderableDrag } from 'react-native-reorderable-list';
import { scheduleOnRN } from 'react-native-worklets';
import { readingById, type ReadingItem } from './readingItems.ts';
import { useReadingQueue } from './useReadingQueue.ts';
import { useStudyMotion } from './useStudyMotion.ts';
import { ArticleDetail } from './ArticleDetail.tsx';
import { serif, useStudyTheme, type StudyTheme } from './theme.ts';

function QueueRow({ item, index, count, read, refined, theme, open, move, disabled }: {
  item: ReadingItem; index: number; count: number; read: boolean; refined: boolean;
  theme: StudyTheme; open: () => void; move: (to: number) => void; disabled: boolean;
}) {
  const drag = useReorderableDrag();
  return <View style={[styles.row, { borderBottomColor: theme.line }]}>
    <Pressable accessibilityRole="button" testID={`note-${item.id}`} accessibilityLabel={item.title}
      accessibilityValue={{ text: `${read ? 'Read' : 'Unread'}, position ${index + 1} of ${count}` }}
      accessibilityHint="Opens the note. Use move actions to change its place in the queue."
      accessibilityActions={[...(index > 0 ? [{ name: 'earlier', label: 'Move earlier' }] : []), ...(index < count - 1 ? [{ name: 'later', label: 'Move later' }] : [])]}
      onAccessibilityAction={event => { if (!disabled) move(index + (event.nativeEvent.actionName === 'earlier' ? -1 : 1)); }}
      disabled={disabled} onPress={open} style={styles.note}>
      <Text style={{ color: theme.muted, fontSize: 15 }}>{String(index + 1).padStart(2, '0')} · {item.category}{read ? ' · Read' : ''}</Text>
      <Text style={{ color: theme.ink, fontFamily: refined ? serif : undefined, fontSize: refined ? 27 : 20, lineHeight: refined ? 34 : 28, marginTop: 8 }}>{item.title}</Text>
      {refined && <Text numberOfLines={2} style={{ color: theme.muted, fontSize: 16, lineHeight: 24, marginTop: 10 }}>{item.body[0]}</Text>}
    </Pressable>
    <Pressable testID={`drag-${item.id}`} accessibilityRole="button" accessibilityLabel={`Reorder ${item.title}`}
      accessibilityHint="Touch and hold to drag. Move actions are also available on the note."
      onLongPress={drag} delayLongPress={250} disabled={disabled} style={styles.grip}>
      <Text style={{ color: theme.accent, fontSize: 28 }} importantForAccessibility="no">≡</Text>
    </Pressable>
  </View>;
}

export function QueueScreen() {
  const queue = useReadingQueue();
  const theme = useStudyTheme();
  const reduced = useStudyMotion();
  const [refined, setRefined] = useState(true);
  const [selected, setSelected] = useState<string>();
  const [generation, setGeneration] = useState(0);
  const generationRef = useRef(0);
  const dragging = useRef(false);
  const [dragActive, setDragActive] = useState(false);
  const cancelDrag = useCallback((cancelledGeneration?: number) => {
    if (cancelledGeneration !== undefined && cancelledGeneration !== generationRef.current) return;
    if (!dragging.current) return;
    dragging.current = false; setDragActive(false);
    generationRef.current += 1; setGeneration(generationRef.current);
    AccessibilityInfo.announceForAccessibility('Reorder cancelled. Your queue is unchanged.');
  }, []);
  const beginDrag = useCallback((startedGeneration: number) => {
    if (AppState.currentState !== 'active' || startedGeneration !== generationRef.current) return;
    dragging.current = true; setDragActive(true);
  }, []);
  const endDrag = useCallback((endedGeneration: number) => {
    if (endedGeneration !== generationRef.current) return;
    dragging.current = false; setDragActive(false);
  }, []);
  useEffect(() => {
    const state = AppState.addEventListener('change', next => {
      if (next === 'active') return;
      if (dragging.current) cancelDrag();
      else { generationRef.current += 1; setGeneration(generationRef.current); }
    });
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!dragging.current) return false;
      cancelDrag(); return true;
    });
    return () => { state.remove(); back.remove(); };
  }, [cancelDrag]);
  const pan = useMemo(() => Gesture.Pan().activateAfterLongPress(280).onTouchesCancelled(() => {
    'worklet'; scheduleOnRN(cancelDrag, generation);
  }), [cancelDrag, generation]);
  const items = queue.state.order.map(id => readingById.get(id)!);
  const item = selected ? readingById.get(selected) : undefined;
  const actions = <View style={styles.actions}>
    <Pressable accessibilityRole="button" testID="undo-change" disabled={!queue.canUndo || dragActive} onPress={queue.undo} style={styles.action}>
      <Text style={{ color: !queue.canUndo || dragActive ? theme.muted : theme.accent, fontSize: 17, fontWeight: '600' }}>Undo</Text>
    </Pressable>
    <Pressable accessibilityRole="button" testID="study-treatment" disabled={dragActive} onPress={() => setRefined(value => !value)} style={styles.action}>
      <Text style={{ color: theme.accent, fontSize: 16 }}>{refined ? 'Show baseline' : 'Show refined'}</Text>
    </Pressable>
  </View>;
  const header = <View style={styles.header}>
    <Text style={{ color: theme.muted, fontSize: 16 }}>An original reading study</Text>
    <Text accessibilityRole="header" style={{ color: theme.ink, fontFamily: refined ? serif : undefined, fontSize: refined ? 56 : 34, marginTop: 8 }}>Folio</Text>
    <Text style={{ color: theme.ink, fontSize: 18, lineHeight: 27, marginTop: 10 }}>A few notes, in your own order.</Text>
    {actions}
    <Text accessibilityLiveRegion="polite" style={{ color: theme.muted, fontSize: 15, lineHeight: 23 }}>
      {queue.state.completed.length} of {items.length} read · {queue.loading ? 'Opening your queue…' : queue.saving ? 'Saving…' : queue.error ? 'Needs attention' : 'Saved on this device'}
    </Text>
    {queue.error && <View style={[styles.error, { backgroundColor: theme.surface }]}>
      <Text accessibilityRole="alert" style={{ color: theme.ink, fontSize: 17, lineHeight: 25 }}>{queue.error}</Text>
      <Pressable accessibilityRole="button" style={styles.action} onPress={queue.ready ? queue.retrySave : queue.load}>
        <Text style={{ color: theme.accent, fontSize: 17 }}>{queue.ready ? 'Retry saving' : 'Retry opening'}</Text>
      </Pressable>
      {!queue.ready && <Pressable accessibilityRole="button" style={styles.action} onPress={queue.fresh}>
        <Text style={{ color: theme.accent, fontSize: 17 }}>Replace saved data with a fresh queue</Text>
      </Pressable>}
    </View>}
    {queue.loading && <ActivityIndicator color={theme.accent} accessibilityLabel="Opening queue" />}
  </View>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.paper }} edges={['top', 'left', 'right']}>
    <ReorderableList key={generation} data={queue.ready ? items : []} keyExtractor={value => value.id}
      ListHeaderComponent={header} contentContainerStyle={styles.list} panGesture={pan}
      animationDuration={reduced ? 0 : 220} cellAnimations={reduced ? { opacity: 1, transform: [] } : undefined}
      onDragStart={() => { 'worklet'; scheduleOnRN(beginDrag, generation); }}
      onDragEnd={({ from, to }) => { 'worklet'; if (from === to) scheduleOnRN(endDrag, generation); }}
      onReorder={({ from, to }) => {
        if (generation !== generationRef.current || AppState.currentState !== 'active') return;
        queue.move(from, to);
        endDrag(generation);
        AccessibilityInfo.announceForAccessibility(`${items[from].title}, position ${to + 1} of ${items.length}`);
      }}
      renderItem={({ item: note, index }) => <QueueRow item={note} index={index} count={items.length} read={queue.state.completed.includes(note.id)}
        refined={refined} theme={theme} disabled={!queue.ready} open={() => { if (!dragging.current) setSelected(note.id); }}
        move={to => { cancelDrag(); queue.move(index, to); }} />}
      ListFooterComponent={<Text style={{ color: theme.muted, fontSize: 15, lineHeight: 23, paddingVertical: 24 }}>Hold a handle to reorder. Open a note to read it. Changes and reading status stay on this device.</Text>} />
    <ArticleDetail item={item} read={!!item && queue.state.completed.includes(item.id)} close={() => setSelected(undefined)}
      toggle={() => { if (item) queue.toggle(item.id); }} reduced={reduced} theme={theme} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { paddingTop: 24, paddingBottom: 24, gap: 2 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginVertical: 16 },
  action: { minHeight: 44, justifyContent: 'center', paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 20 },
  note: { flex: 1, minWidth: 0, paddingRight: 8, minHeight: 60 },
  grip: { minWidth: 48, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
  error: { padding: 16, gap: 6, marginTop: 12, borderRadius: 8 },
});
