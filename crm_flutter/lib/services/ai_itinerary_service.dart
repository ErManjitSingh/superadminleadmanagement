import 'package:dio/dio.dart';

import '../core/api_client.dart';

class AiItineraryDay {
  AiItineraryDay({
    required this.day,
    required this.title,
    required this.description,
    this.meals,
    this.transport,
  });

  final int day;
  final String title;
  final String description;
  final String? meals;
  final String? transport;

  factory AiItineraryDay.fromJson(Map<String, dynamic> j, int index) {
    final day = (j['day'] as num?)?.toInt() ?? index + 1;
    final title = (j['title'] ?? j['name'] ?? 'Day $day').toString();
    final description = (j['description'] ?? j['activities'] ?? '').toString();
    return AiItineraryDay(
      day: day,
      title: title,
      description: description,
      meals: j['meals']?.toString(),
      transport: j['transport']?.toString(),
    );
  }
}

class AiItineraryResult {
  AiItineraryResult({
    required this.days,
    required this.totalDays,
    required this.totalNights,
    this.source,
    this.pickup,
    this.drop,
    this.warning,
  });

  final List<AiItineraryDay> days;
  final int totalDays;
  final int totalNights;
  final String? source;
  final String? pickup;
  final String? drop;
  final String? warning;
}

/// POST /ai-itinerary/generate — same API as website quotation AI generator.
class AiItineraryService {
  AiItineraryService(this._api);
  final ApiClient _api;

  Future<AiItineraryResult> generate({
    required String prompt,
    String? destination,
    int? days,
    int? nights,
    int variationSeed = 0,
    bool includeMeals = true,
  }) async {
    try {
      final res = await _api.post(
        '/ai-itinerary/generate',
        data: {
          'prompt': prompt.trim(),
          if (destination != null && destination.trim().isNotEmpty) 'destination': destination.trim(),
          if (days != null && days > 0) 'days': days,
          if (nights != null && nights >= 0) 'nights': nights,
          'variationSeed': variationSeed,
          'includeMeals': includeMeals,
        },
        options: Options(
          receiveTimeout: const Duration(seconds: 120),
          sendTimeout: const Duration(seconds: 30),
        ),
      );
      final data = res.data;
      if (data is! Map) throw Exception('Invalid AI response');
      final map = Map<String, dynamic>.from(data);
      if (map['success'] == false) {
        throw Exception(map['message']?.toString() ?? 'AI generation failed');
      }
      return _parse(map);
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map) {
        final code = data['code']?.toString();
        final msg = data['message']?.toString();
        if (code == 'AI_NOT_CONFIGURED') {
          throw Exception(msg ?? 'AI is not configured on the server');
        }
        if (msg != null && msg.isNotEmpty) throw Exception(msg);
      }
      throw Exception(apiErrorMessage(e));
    }
  }

  AiItineraryResult _parse(Map<String, dynamic> map) {
    final raw = map['days'] ?? map['itinerary'] ?? [];
    final list = raw is List ? raw : const [];
    final days = <AiItineraryDay>[];
    for (var i = 0; i < list.length; i++) {
      final item = list[i];
      if (item is Map) {
        days.add(AiItineraryDay.fromJson(Map<String, dynamic>.from(item), i));
      }
    }
    if (days.isEmpty) throw Exception('AI returned an empty itinerary');

    final logistics = map['logistics'] is Map ? Map<String, dynamic>.from(map['logistics'] as Map) : null;
    final totalDays = (map['totalDays'] as num?)?.toInt() ?? days.length;
    final totalNights = (map['totalNights'] as num?)?.toInt() ?? (totalDays > 0 ? totalDays - 1 : 0);

    return AiItineraryResult(
      days: days,
      totalDays: totalDays,
      totalNights: totalNights,
      source: map['source']?.toString(),
      pickup: logistics?['pickup']?.toString() ?? map['pickup']?.toString(),
      drop: logistics?['drop']?.toString() ?? map['drop']?.toString(),
      warning: map['warning']?.toString(),
    );
  }
}
