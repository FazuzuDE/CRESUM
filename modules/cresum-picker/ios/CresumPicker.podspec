Pod::Spec.new do |s|
  s.name = 'CresumPicker'
  s.version = '1.0.0'
  s.summary = 'Native Apple picker wheels for CRESUM'
  s.description = s.summary
  s.license = 'UNLICENSED'
  s.author = 'CRESUM'
  s.homepage = 'https://github.com/FazuzuDE/CRESUM'
  s.source = { git: 'https://github.com/FazuzuDE/CRESUM.git' }
  s.platforms = { ios: '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
