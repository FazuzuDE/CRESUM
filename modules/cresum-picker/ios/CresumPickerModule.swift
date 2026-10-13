import ExpoModulesCore
import UIKit

public class CresumPickerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CresumPicker")
    View(CresumPickerView.self) {
      Events("onSelect", "onInteraction")
      Prop("columns") { (view: CresumPickerView, columns: [[String]]) in
        view.columns = columns
      }
      Prop("selected") { (view: CresumPickerView, selected: [Int]) in
        view.selection = selected
      }
      Prop("selectionRevision") { (_: CresumPickerView, _: Int) in }
      Prop("labels") { (view: CresumPickerView, labels: [String]) in
        view.picker.accessibilityLabel = labels.joined(separator: ", ")
      }
      OnViewDidUpdateProps { (view: CresumPickerView) in
        view.synchronize()
      }
    }
  }
}

final class CresumPickerView: ExpoView, UIPickerViewDataSource, UIPickerViewDelegate, UIGestureRecognizerDelegate {
  let picker = UIPickerView()
  let onSelect = EventDispatcher()
  let onInteraction = EventDispatcher()
  private var interacting = false
  var columns: [[String]] = []
  var selection: [Int] = []
  private var reportedSelection: [Int] = []
  private var renderedColumns: [[String]] = []
  private let feedback = UISelectionFeedbackGenerator()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    overrideUserInterfaceStyle = .light
    clipsToBounds = true
    picker.dataSource = self
    picker.delegate = self
    addSubview(picker)
    // Observe public pan gestures without stealing UIKit wheel recognition.
    let observer = UIPanGestureRecognizer(target: self, action: #selector(observePan(_:)))
    observer.cancelsTouchesInView = false
    observer.delegate = self
    picker.addGestureRecognizer(observer)
  }
  override func layoutSubviews() {
    super.layoutSubviews()
    picker.frame = bounds
  }
  func synchronize() {
    // Unrelated React renders (e.g. the workout clock) must not reset a moving wheel.
    guard !interacting else { return }
    if renderedColumns != columns {
      renderedColumns = columns
      picker.reloadAllComponents()
    }
    for component in columns.indices where !columns[component].isEmpty {
      let row = max(0, min(selection.indices.contains(component) ? selection[component] : 0, columns[component].count - 1))
      if picker.selectedRow(inComponent: component) != row {
        picker.selectRow(row, inComponent: component, animated: false)
      }
    }
    reportedSelection = selection
  }
  func numberOfComponents(in pickerView: UIPickerView) -> Int { columns.count }
  func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int { columns[component].count }
  func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? { columns[component][row] }
  func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
    defer { setInteracting(false) }
    guard !reportedSelection.indices.contains(component) || reportedSelection[component] != row else { return }
    while reportedSelection.count <= component { reportedSelection.append(0) }
    reportedSelection[component] = row
    feedback.selectionChanged()
    feedback.prepare()
    // UIPickerView owns its standard wheel click. Respect system audio settings;
    // do not invoke private SystemSoundID values or play synthetic recordings.
    onSelect(["component": component, "row": row])
  }
  private func setInteracting(_ active: Bool) {
    guard interacting != active else { return }
    interacting = active
    onInteraction(["active": active])
  }
  @objc private func observePan(_ gesture: UIPanGestureRecognizer) {
    switch gesture.state {
    case .began: setInteracting(true)
    case .cancelled, .failed: setInteracting(false)
    default: break // After release, wait for UIKit didSelectRow (including unchanged rows).
    }
  }
  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool { true }
  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil { setInteracting(false) }
  }
}
