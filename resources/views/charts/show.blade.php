@extends('app')

@section('content')
	<div class="chart-show-module" style="position:absolute;top:0;left:0;right:0;bottom:0;">
		@include('charts/partials/_chart')
	</div>
@endsection

@section('scripts')
	<script src="{{ elixir('js/ChartApp.js') }}"></script>
@endsection