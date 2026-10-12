import ExpoModulesCore
import UIKit

public class CresumPickerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CresumPicker")
    View(CresumPickerView.self) {
      Events("onSelect")
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

final class CresumPickerView: ExpoView, UIPickerViewDataSource, UIPickerViewDelegate {
  let picker = UIPickerView()
  let onSelect = EventDispatcher()
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
  }
  override func layoutSubviews() {
    super.layoutSubviews()
    picker.frame = bounds
  }
  func synchronize() {
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
    guard !reportedSelection.indices.contains(component) || reportedSelection[component] != row else { return }
    while reportedSelection.count <= component { reportedSelection.append(0) }
    reportedSelection[component] = row
    feedback.selectionChanged()
    feedback.prepare()
    // UIPickerView owns its standard wheel click. Respect system audio settings;
    // do not invoke private SystemSoundID values or play synthetic recordings.
    onSelect(["component": component, "row": row])
  }
}
